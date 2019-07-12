import PolkadotModule from "./PolkadotModule";

// noinspection JSIgnoredPromiseFromCall
new PolkadotModule().bench().catch(e => {
    console.error(e);
    process.exit(-1);
});
