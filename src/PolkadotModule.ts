import {BlockchainModule, BuiltinBenchProfile, Logger, Preparation} from "tank.bench-common";
import Constants from "./constants/Constants";
import configSchema from "./config/configSchema";
import PolkadotDefaultBenchProfile from "./PolkadotDefaultBenchProfile";
import PolkadotPreparation from "./PolkadotPreparation";

export default class PolkadotModule extends BlockchainModule {


    createPreparationStep(commonConfig: any, moduleConfig: any, logger: Logger): Preparation {
        return new PolkadotPreparation(commonConfig, moduleConfig, logger);
    }

    getConfigSchema(): any {
        return configSchema;
    }

    getBuiltinProfiles(): BuiltinBenchProfile[] {
        return [PolkadotDefaultBenchProfile.profileMeta];
    }

    getDefaultConfigFilePath(): string | null {
        return Constants.defaultConfigFilePath();
    }
}
