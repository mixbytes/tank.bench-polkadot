import {BuiltinProfile} from "tank.bench-common";
import PolkadotBenchProfile from "./PolkadotBenchProfile";
import PolkadotPreparationProfile from "./PolkadotPreparationProfile";
import configSchema from "./config/configSchema";

const profile: BuiltinProfile = {
    benchProfile: PolkadotBenchProfile,
    fileName: __filename,
    name: "default",
    preparationProfile: PolkadotPreparationProfile,
    configSchema: configSchema,
    telemetryProfile: undefined
};

export default profile;
