const {BenchProfile, PreparationProfile} = require("tank.bench-common");
const {Keyring} = require("@polkadot/keyring");
const {ApiPromise, WsProvider} = require("@polkadot/api");

const TOKENS_TO_SEND = 1;
const USERS_COUNT = 1000;

const stringSeed = (seed) => {
    return '//user//' + ("0000" + seed).slice(-4);
};

class Bench extends BenchProfile {

    getRandomSeed() {
        let firstSeed = this.usersConfig.firstSeed;
        let lastSeed = this.usersConfig.lastSeed;

        return Math.floor(Math.random() * (lastSeed - firstSeed + 1)) + firstSeed;
    }

    // noinspection JSMethodCanBeStatic
    getVeryRandomSeed() {
        return Math.floor(Math.random() * USERS_COUNT);
    }

    async asyncConstruct(threadId, benchConfig) {
        // ed25519 and sr25519
        this.keyring = new Keyring({type: 'sr25519'});
        this.api = await ApiPromise.create(new WsProvider(benchConfig.moduleConfig.wsUrl));

        this.usersConfig = benchConfig.usersConfig;
        this.userNoncesArray = new Int32Array(benchConfig.usersConfig.userNonces);

        this.keyPairs = new Map();
        for (let seed = 0; seed < USERS_COUNT; seed++) {
            this.keyPairs.set(seed, this.keyring.addFromUri(stringSeed(seed)));
        }
    }

    getRandomReceiverSeed(senderSeed) {
        let seed = this.getVeryRandomSeed();
        if (seed === senderSeed)
            seed++;
        if (seed >= this.usersConfig.totalUsersCount - 1)
            seed = 0;
        return seed;

    }

    getRandomSenderSeed() {
        return this.getRandomSeed();
    }

    async commitTransaction(uniqueData) {

        let senderSeed = this.getRandomSenderSeed();
        let senderKeyPair = this.keyPairs.get(senderSeed);

        let nonce = Atomics.add(this.userNoncesArray, senderSeed - this.usersConfig.firstSeed, 1) + 1;

        let receiverSeed = this.getRandomReceiverSeed(senderSeed);
        let receiverKeyringPair = this.keyPairs.get(receiverSeed);

        let transfer = this.api.tx.balances.transfer(receiverKeyringPair.address, TOKENS_TO_SEND);
        await transfer.signAndSend(senderKeyPair, {nonce: nonce});

        return {code: 10, error: null}

    }
}


class Preparation extends PreparationProfile {

    async prepare(commonConfig, moduleConfig) {
        let api = await ApiPromise.create(new WsProvider(moduleConfig.wsUrl));
        let keyring = new Keyring({type: 'sr25519'});

        const [chain, nodeName, nodeVersion] = await Promise.all([
            api.rpc.system.chain(),
            api.rpc.system.name(),
            api.rpc.system.version()
        ]);

        this.logger.log(`Bench is connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

        let firstSeed = 0;
        let lastSeed = USERS_COUNT - 1;

        if (commonConfig.sharding.shards > 0 && commonConfig.sharding.shardId >= 0) {
            let seedsInShard = USERS_COUNT / commonConfig.sharding.shards;
            firstSeed = Math.floor(seedsInShard * commonConfig.sharding.shardId);
            lastSeed = Math.floor(firstSeed + seedsInShard) - 1
        }

        let seedsCount = lastSeed - firstSeed + 1;

        let userNonces = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * seedsCount);
        let userNoncesArray = new Int32Array(userNonces);

        let getNoncesPromises = [];

        this.logger.log("Fetching nonces for accounts...");

        for (let seed = firstSeed; seed <= lastSeed; seed++) {
            getNoncesPromises.push(new Promise(async resolve => {
                let keys = keyring.addFromUri(stringSeed(seed));
                let nonce = await api.query.system.accountNonce(keys.address);
                resolve(nonce.toNumber());
            }));
        }

        let nonces = await Promise.all(getNoncesPromises);
        this.logger.log("All nonces fetched!");

        nonces.forEach((nonce, i) => {
            userNoncesArray[i] = nonce
        });

        return {
            commonConfig: commonConfig,
            moduleConfig: moduleConfig,
            usersConfig: {
                lastSeed,
                firstSeed,
                userNonces
            }
        }
    }
}

module.exports = {
    fileName: __filename,
    benchProfile: Bench,
    preparationProfile: Preparation
};



