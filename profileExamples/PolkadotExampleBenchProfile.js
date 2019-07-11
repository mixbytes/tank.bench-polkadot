const {BenchProfile} = require("tank.bench-common");
const {Keyring} = require("@polkadot/keyring");
const {ApiPromise, WsProvider} = require("@polkadot/api");

const TOKENS_TO_SEND = 1;

class PolkadotExampleBenchProfile extends BenchProfile {

    // noinspection JSMethodCanBeStatic
    stringSeed(seed) {
        return '//user//' + ("0000" + seed).slice(-4);
    }

    getRandomSeed() {
        let firstSeed = this.benchConfig.usersConfig.firstSeed;
        let lastSeed = this.benchConfig.usersConfig.lastSeed;

        return Math.floor(Math.random() * (lastSeed - firstSeed + 1)) + firstSeed;
    }

    // noinspection JSMethodCanBeStatic
    getVeryRandomSeed() {
        return Math.floor(Math.random() * this.benchConfig.usersConfig.totalUsersCount);
    }

    async asyncConstruct(threadId) {
        // ed25519 and sr25519
        this.threadId = threadId;
        this.keyring = new Keyring({type: 'sr25519'});
        this.api = await ApiPromise.create(new WsProvider(this.benchConfig.moduleConfig.wsUrl));

        this.usersConfig = this.benchConfig.usersConfig;
        this.userNoncesArray = new Int32Array(this.benchConfig.usersConfig.userNonces);

        this.keyPairs = new Map();
        for (let seed = 0; seed < this.usersConfig.totalUsersCount; seed++) {
            this.keyPairs.set(seed, this.keyring.addFromUri(this.stringSeed(seed)));
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


module.exports = PolkadotExampleBenchProfile;
