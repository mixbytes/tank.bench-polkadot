import BlockchainModule from "tank.bench-common/dist/module/BlockchainModule";
import BenchStep from "tank.bench-common/dist/module/steps/BenchStep";
import PrepareStep from "tank.bench-common/dist/module/steps/PrepareStep";
import Logger from "tank.bench-common/dist/resources/Logger";
import PolkadotModuleBenchStep from "./steps/PolkadotModuleBenchStep";
import PolkadotModulePrepareStep from "./steps/PolkadotModulePrepareStep";
import convictConfig from "./config/convictConfig";
import * as fs from "fs";
import Constants from "./constants/Constants";
import getConvict from "./config/convictConfig";

export default class PolkadotModule implements BlockchainModule {
    createBenchStep(config: any, logger: Logger): BenchStep {
        return new PolkadotModuleBenchStep(config, logger);
    }

    createPrepareStep(config: any, logger: Logger): PrepareStep {
        let convictConfig = getConvict();
        let convictFile = convictConfig.getProperties().configFile;
        if (fs.existsSync(convictFile)) {
            try {
                convictConfig.loadFile(convictFile);
                convictConfig.validate({allowed: 'strict'});
            } catch (e) {
                console.error(e);
            }
        }
        return new PolkadotModulePrepareStep({...config, polkadot: convictConfig.getProperties()}, logger);
    }

    getFileName(): string {
        return __filename;
    }
}
