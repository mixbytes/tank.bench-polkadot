import BenchRunner from "tank.bench-common";
import PolkadotModule from "./PolkadotModule";

// noinspection JSIgnoredPromiseFromCall
new BenchRunner(new PolkadotModule()).bench().then(() => {
    console.log("Bench finished!");
});
