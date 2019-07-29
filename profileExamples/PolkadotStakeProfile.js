const {BenchProfile, PreparationProfile} = require("tank.bench-common");
const {Keyring} = require("@polkadot/keyring");
const {ApiPromise, WsProvider} = require("@polkadot/api");

// Users with special functions
const SUPER_USERS_COUNT = 0;
// Any users
const TOTAL_USERS_COUNT = 100;

const USERS_COUNT = TOTAL_USERS_COUNT - SUPER_USERS_COUNT;

const stringSeed = (seed) => {
    return '//user//' + ("0000" + seed).slice(-4);
};

// The base profile that just send one token from some accounts to another ones.
// The account names are //user//0000 to //user//0999
class Bench extends BenchProfile {

    getRandomSeed() {
        let firstSeed = this.usersConfig.firstSeed;
        let lastSeed = this.usersConfig.lastSeed;

        return Math.floor(Math.random() * (lastSeed - firstSeed + 1)) + firstSeed;
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

    getRandomSenderSeed() {
        return this.getRandomSeed();
    }

    async commitTransaction() {
        let senderSeed = this.getRandomSenderSeed();
        let senderKeyPair = this.keyPairs.get(senderSeed);

        let nonce = Atomics.add(this.userNoncesArray, senderSeed - this.usersConfig.firstSeed, 1);

        let bondExtra = this.api.tx.staking.bondExtra(
            1,
        );

        await bondExtra.signAndSend(senderKeyPair, {nonce: nonce});

        return {code: 10, error: null}
    }
}


class Preparation extends PreparationProfile {

    getNonce(seed) {
        return new Promise(async resolve => {
            let keys = this.keyring.addFromUri(stringSeed(seed));
            let nonce = await this.api.query.system.accountNonce(keys.address);
            resolve(nonce.toNumber());
        });
    }

    async bond(accountSeed, controllerSeed) {

        let accountKeyPair = this.keyPairs.get(accountSeed);
        let accountNonce = Atomics.add(this.userNoncesArray, accountSeed - this.firstSeed, 1);

        let controllerKeyPair = this.keyPairs.get(controllerSeed);

        let bond = this.api.tx.staking.bond(
            controllerKeyPair.address,
            1,
            "Staked"
        );

        return await bond.signAndSend(accountKeyPair, {nonce: accountNonce});
    }

    async prepare(commonConfig, moduleConfig) {
        this.api = await ApiPromise.create(new WsProvider(moduleConfig.wsUrl));
        this.keyring = new Keyring({type: 'sr25519'});

        const [chain, nodeName, nodeVersion] = await Promise.all([
            this.api.rpc.system.chain(),
            this.api.rpc.system.name(),
            this.api.rpc.system.version()
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

        let userNonces = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * (seedsCount + SUPER_USERS_COUNT));
        this.userNoncesArray = new Int32Array(userNonces);

        let getNoncesPromises = [];

        this.logger.log("Fetching nonces for accounts...");

        for (let seed = firstSeed; seed <= lastSeed; seed++) {
            getNoncesPromises.push(this.getNonce(seed))
        }

        for (let seed = USERS_COUNT + 1; seed <= TOTAL_USERS_COUNT; seed++) {
            getNoncesPromises.push(this.getNonce(seed))
        }

        let nonces = await Promise.all(getNoncesPromises);
        this.logger.log("All nonces fetched!");

        nonces.forEach((nonce, i) => {
            this.userNoncesArray[i] = nonce
        });

        this.keyPairs = new Map();
        for (let seed = firstSeed; seed <= lastSeed; seed++) {
            this.keyPairs.set(seed, this.keyring.addFromUri(stringSeed(seed)));
        }

        this.firstSeed = firstSeed;
        this.lastSeed = lastSeed;

        this.logger.log("Staking tokens on accounts...");
        for (let seed = firstSeed; seed <= lastSeed; seed += 2) {
            if (seed + 1 > lastSeed)
                break;
            await this.bond(
                seed,
                seed + 1
            );
            await this.bond(
                seed + 1,
                seed
            );
        }
        this.logger.log("Staking tokens complete!");

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



