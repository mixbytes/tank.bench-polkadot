const {BenchCase} = require("tank.bench-common");
const {Keyring} = require("@polkadot/keyring");
const {ApiPromise, WsProvider} = require("@polkadot/api");

// const testKeyring = require('@polkadot/keyring/testing');
// const {hexToU8a, bufferToU8a} = require('@polkadot/util');
// const {randomAsU8a, blake2AsHex} = require('@polkadot/util-crypto');
// const {BN} = require('bn.js');


class PolkadotModuleBenchCase extends BenchCase {
    async timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stringSeed(seed) {
        return '//user//' + ("0000" + seed).slice(-4);
    }

    getRandomSeed() {
        return Math.floor(Math.random() * 1000);
    }

    async asyncConstruct(threadId) {
        this.balances = new Map();
        this.amountToSendGlobal = 0;
        //this.keyring = new testKeyring.default();
        // ed25519 and sr25519
        this.keyring = new Keyring({type: 'sr25519'});
        this.api = await ApiPromise.create(new WsProvider(this.benchConfig.moduleConfig.wsUrl));

        const [chain, nodeName, nodeVersion] = await Promise.all([
            this.api.rpc.system.chain(),
            this.api.rpc.system.name(),
            this.api.rpc.system.version()
        ]);

        console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

        await this.chooseNewSender()
    }

    getRandomReceiverSeed() {
        let seed = this.getRandomSeed();
        if (seed === this.currentSenderSeed)
            seed++;
        seed %= 1000;
        return seed;
    }

    async chooseNewSender() {
        this.currentSenderSeed = this.getRandomSeed();

        this.currentSenderKeyringPair = this.keyring.addFromUri(this.stringSeed(this.currentSenderSeed));

        let balance = await this.api.query.balances.freeBalance(this.currentSenderKeyringPair.address);
        this.balances.set(this.currentSenderSeed, balance.toNumber());
    }

    async commitTransaction(uniqueData) {

        // return {code: 10, error: null};

        // switch to next sender after all funds of currentSenderKeyringPair finished

        while (this.balances.get(this.currentSenderSeed) <= 1) {
            await this.chooseNewSender()
        }

        this.currentSenderNonce = await this.api.query.system.accountNonce(this.currentSenderKeyringPair.address);


        // To be sure the receiver and sender are not equal
        let receiverSeed = this.getRandomReceiverSeed();
        let receiverKeyringPair = await this.keyring.addFromUri(this.stringSeed(receiverSeed));


        // this.currentReceiverSeed = this.getRandomReceiverSeed(this.currentSenderSeed);
        // let receiver = await this.keyring.addFromUri(this.currentReceiverSeed);
        // let previous = await this.api.query.balances.freeBalance(receiver.address);
        // let sender_balance = await this.api.query.balances.freeBalance(this.currentSenderKeyringPair.address);
        // this.current_sender_nonces[this.currentSenderSeed]++;


        // console.log('[DEBUG] Prepared TX: nonce: ' +
        //     this.current_sender_nonces[this.currentSenderSeed] +
        //     ', from: ' +
        //     this.currentSenderSeed +
        //     '(balances: ' +
        //     sender_balance +
        //     '), to '
        //     + this.currentReceiverSeed +
        //     ", sending " +
        //     this.balances[this.currentSenderSeed]);

        let amountToSend = this.amountToSendGlobal;
        this.amountToSendGlobal++;

        let transfer = this.api.tx.balances.transfer(receiverKeyringPair.address, amountToSend);


        let hash = await transfer.signAndSend(this.currentSenderKeyringPair, {nonce: this.currentSenderNonce});
        // let send = await transfer.send();
        // @ts-ignore
        // console.log(hash.signature.toJSON().signature);
        this.balances.set(this.currentSenderSeed, this.balances.get(this.currentSenderSeed) - amountToSend);

        // sign(this.currentSenderKeyringPair, {nonce: this.currentSenderNonce})
        //     .send(result => {
        //         // console.log('[DEBUG] Status of TX: nonce: ' + this.current_sender_nonces[this.currentSenderSeed] + ', from: ' + this.currentSenderSeed + '(balances: ' + sender_balance + '), to ' + this.currentReceiverSeed + ", sending " + this.balances[this.currentSenderSeed] + ", status: " + result.status);
        //         if (result.status.isFinalized) {
        //             // console.log('[DEBUG] Finalized! TX: nonce: ' + this.current_sender_nonces[this.currentSenderSeed] + ', from: ' + this.currentSenderSeed + '(balances: ' + sender_balance + '), to ' + this.currentReceiverSeed + ", sending " + this.balances[this.currentSenderSeed] + ", tx: " + result.status.asFinalised.toHex());
        //             return result.status.asFinalized.toHex();
        //         }
        //     })
        // return await this.api.tx.balances.transfer(
        //     receiverKeyringPair.address,
        //     this.balances[this.currentSenderSeed]
        // )
        //     .sign(this.currentSenderKeyringPair, {nonce: this.current_sender_nonces[this.currentSenderSeed]})
        //     .send(result => {
        //         // console.log('[DEBUG] Status of TX: nonce: ' + this.current_sender_nonces[this.currentSenderSeed] + ', from: ' + this.currentSenderSeed + '(balances: ' + sender_balance + '), to ' + this.currentReceiverSeed + ", sending " + this.balances[this.currentSenderSeed] + ", status: " + result.status);
        //         if (result.status.isFinalized) {
        //             // console.log('[DEBUG] Finalized! TX: nonce: ' + this.current_sender_nonces[this.currentSenderSeed] + ', from: ' + this.currentSenderSeed + '(balances: ' + sender_balance + '), to ' + this.currentReceiverSeed + ", sending " + this.balances[this.currentSenderSeed] + ", tx: " + result.status.asFinalised.toHex());
        //             return result.status.asFinalized.toHex();
        //         }
        //     })

        return {code: 10, error: null}

    }
}

module.exports = PolkadotModuleBenchCase;
