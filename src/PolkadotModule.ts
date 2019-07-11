import {BlockchainModule, BuiltinProfile} from "tank.bench-common";
import Constants from "./constants/Constants";
import configSchema from "./config/configSchema";
import PolkadotDefaultProfile from "./PolkadotDefaultProfile";

export default class PolkadotModule extends BlockchainModule {

    getConfigSchema(): any {
        return configSchema;
    }

    getBuiltinProfiles(): BuiltinProfile[] {
        return [{
            name: "default",
            profile: PolkadotDefaultProfile
        }];
    }

    getDefaultConfigFilePath(): string | null {
        return Constants.defaultConfigFilePath();
    }
}
