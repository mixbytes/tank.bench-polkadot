import {BlockchainModule, BenchStep, PrepareStep, BenchTelemetryStep, Logger} from "tank.bench-common";
import PolkadotModuleBenchStep from "./steps/PolkadotModuleBenchStep";
import PolkadotModulePrepareStep from "./steps/PolkadotModulePrepareStep";
import PolkadotModuleBenchTelemetryStep from "./steps/PolkadotModuleBenchTelemetryStep";
import Constants from "./constants/Constants";
import configSchema from "./config/configSchema";

export default class PolkadotModule implements BlockchainModule {
    createBenchStep(benchConfig: any, logger: Logger): BenchStep {
        return new PolkadotModuleBenchStep(benchConfig, logger);
    }

    createPrepareStep(commonConfig: any, moduleConfig: any, logger: Logger): PrepareStep {
        return new PolkadotModulePrepareStep(commonConfig, moduleConfig, logger);
    }
    
    createBenchTelemetryStep(benchConfig: any, logger: Logger): BenchTelemetryStep {
        return new PolkadotModuleBenchTelemetryStep(benchConfig, logger);
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
