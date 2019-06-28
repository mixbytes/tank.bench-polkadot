import {BlockchainModule, BenchStep, Logger} from "tank.bench-common";
import PolkadotModuleBenchStep from "./steps/PolkadotModuleBenchStep";
import Constants from "./constants/Constants";
import configSchema from "./config/configSchema";

export default class PolkadotModule extends BlockchainModule {
    createBenchStep(benchConfig: any, logger: Logger): BenchStep {
        return new PolkadotModuleBenchStep(benchConfig, logger);
    }

    getConfigSchema(): any {
        return configSchema;
    }

    getDefaultConfigFilePath(): string | null {
        return Constants.defaultConfigFilePath();
    }

    getFileName(): string {
        return __filename;
    }
}
