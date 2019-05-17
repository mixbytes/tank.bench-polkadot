const { ApiPromise, WsProvider } = require('@polkadot/api');
import BenchStep from "tank.bench-common/dist/module/steps/BenchStep";
import Strings from "../constants/Strings";

const { Keyring } = require('@polkadot/keyring');
const testKeyring = require('@polkadot/keyring/testing');
const { hexToU8a, bufferToU8a } = require('@polkadot/util');
const { randomAsU8a } = require('@polkadot/util-crypto');


export default class PolkadotModuleBenchStep extends BenchStep {
    private api?: any;
    private keyring?: any;

    async asyncConstruct() {
        //this.keyring = new testKeyring.default();
        // ed25519 and sr25519
        this.keyring = new Keyring({ type: 'ed25519' });
        this.api = await ApiPromise.create(new WsProvider(this.config.polkadot.wsUrl));
    }

    async commitBenchmarkTransaction(uniqueData: any) {
        
        let from_account = this.keyring.addFromUri('//Alice');
        let from_balance = await this.api.query.balances.freeBalance(from_account);
        await console.log("Account N 0, " + from_account.address() + ", balance: " + from_balance);
        
        // let from_nonce = await this.api.query.system.accountNonce(from_account);
        let to_account = this.keyring.addFromUri('//Bob');
        let txhash = await this.api.tx.balances.transfer(to_account.address(), 123).signAndSend(from_account);
        
        // let to_balance = await this.api.query.balances.freeBalance(to_account);
        // await console.log("Account N 1, " + to_account.address() + ", balance: " + to_balance);
        return Promise.resolve();
    }
}

