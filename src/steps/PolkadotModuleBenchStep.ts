const { Api, ApiPromise, WsProvider } = require('@polkadot/api');
import BenchStep from "tank.bench-common/dist/module/steps/BenchStep";

const fetch = require("node-fetch");

export default class PolkadotModuleBenchStep extends BenchStep {
    private api?: any;

    async asyncConstruct() {
        this.api = await ApiPromise.create(new WsProvider(this.config.polkadot.wsUrl));
    }

    getKeyAccounts() {
        return [this.config.polkadot.fromAccount];
    }

    async commitBenchmarkTransaction(uniqueData: any) {
        await console.log("commit benchmark tx");
        return Promise.resolve(); 
    }
}

