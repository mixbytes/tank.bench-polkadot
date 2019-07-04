import {BlockchainModule} from "tank.bench-common";
import Constants from "./constants/Constants";
import configSchema from "./config/configSchema";

export default class PolkadotModule extends BlockchainModule {
    getConfigSchema(): any {
        return configSchema;
    }

    getDefaultConfigFilePath(): string | null {
        return Constants.defaultConfigFilePath();
    }
}
