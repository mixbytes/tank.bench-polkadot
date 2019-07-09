import {Preparation} from "tank.bench-common";
import {ApiPromise, WsProvider} from "@polkadot/api";

export default class PolkadotPreparation extends Preparation{
    async prepare() {
        let api = await ApiPromise.create(new WsProvider(this.moduleConfig.wsUrl));

        const [chain, nodeName, nodeVersion] = await Promise.all([
            api.rpc.system.chain(),
            api.rpc.system.name(),
            api.rpc.system.version()
        ]);

        console.log(`Bench is connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

        return {
            commonConfig: this.commonConfig,
            moduleConfig: this.moduleConfig,
        }
    }
}
