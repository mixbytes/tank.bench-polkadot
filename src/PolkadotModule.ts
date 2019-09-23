import {BlockchainModule, BuiltinProfile} from "tank.bench-common";
import Constants from "./constants/Constants";
import PolkadotDefaultProfile from "./PolkadotDefaultProfile";
import configSchema from "./config/configSchema";

export default class PolkadotModule extends BlockchainModule {

    getBuiltinProfiles(): BuiltinProfile[] {
        return [PolkadotDefaultProfile];
    }


    getConfigSchema(): any {
        return configSchema;
    }

    getDefaultConfigFilePath(): string | null {
        return Constants.defaultConfigFilePath();
    }
}
