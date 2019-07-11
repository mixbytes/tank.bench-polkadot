import {Profile} from "tank.bench-common";
import PolkadotBenchProfile from "./PolkadotBenchProfile";
import PolkadotPreparationProfile from "./PolkadotPreparationProfile";

const profile: Profile = {
    benchProfile: PolkadotBenchProfile,
    fileName: __filename,
    preparationProfile: PolkadotPreparationProfile,
    telemetryProfile: undefined
};

export default profile;
