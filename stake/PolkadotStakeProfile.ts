import {
    CommitTransactionArgs,
    ConstructBenchArgs,
    DestroyBenchArgs,
    PrepareArgs,
    Profile,
    TransactionResult
} from "tank.bench-profile";

import {Keyring} from "@polkadot/keyring";
import {ApiPromise, WsProvider} from "@polkadot/api";
import {KeyringPair} from "@polkadot/keyring/types";
import {Index} from "@polkadot/types/interfaces";

const USERS_COUNT = 1000;

const configSchema = {
    wsUrl: {
        arg: 'polkadot.wsUrl',
        format: String,
        default: "",
        doc: "WS URL"
    },
};

const stringSeed = (seed: number): string => {
    return '//user' + ("00000" + seed).slice(-5);
};

const initApi = async (wsUrl: string) => {
    let provider = new WsProvider(wsUrl);

    let api = await ApiPromise.create({provider});

    let keyring = new Keyring({type: 'sr25519'});

    return {provider, api, keyring};
};

type UsersConfig = {
    lastSeed: number,
    firstSeed: number
    userNonces: SharedArrayBuffer,
    totalUsersCount: number
}


const bond = async (keyPairs: Map<number, KeyringPair>,
                    userNoncesArray: Int32Array,
                    api: ApiPromise,
                    accountSeed: number,
                    controllerSeed: number
) => {
    const accountKeyPair = keyPairs.get(accountSeed)!;
    const accountNonce = Atomics.add(userNoncesArray, accountSeed, 1);

    const controllerKeyPair = keyPairs.get(controllerSeed)!;

    const bond = api.tx.staking.bond(
        controllerKeyPair.address,
        1,
        "Staked"
    );

    return bond.signAndSend(accountKeyPair, {nonce: accountNonce});
};


const prepare = async (
    {commonConfig, moduleConfig}: PrepareArgs<typeof configSchema>) => {

    const {keyring, api} = await initApi(moduleConfig.wsUrl);

    const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
    ]);

    console.log(`Bench is connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

    let firstSeed: number = 0;
    let lastSeed: number = USERS_COUNT - 1;

    if (commonConfig.sharding.shards > 0 && commonConfig.sharding.shardId >= 0) {
        let seedsInShard = USERS_COUNT / commonConfig.sharding.shards;
        firstSeed = Math.floor(seedsInShard * commonConfig.sharding.shardId);
        lastSeed = Math.floor(firstSeed + seedsInShard) - 1
    }

    let seedsCount = lastSeed - firstSeed + 1;

    let userNonces = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * seedsCount);
    let userNoncesArray = new Int32Array(userNonces);

    let getNoncesPromises = new Array<Promise<number>>();

    console.log("Fetching nonces for accounts...");

    for (let seed = firstSeed; seed <= lastSeed; seed++) {
        getNoncesPromises.push(new Promise<number>(async resolve => {
            let stringSeedRes = stringSeed(seed);
            let keys = keyring.addFromUri(stringSeedRes);
            let nonce = <Index>await api.query.system.accountNonce(keys.address);
            // @ts-ignore
            resolve(nonce.toNumber());
        }));
    }

    let nonces = await Promise.all(getNoncesPromises);
    console.log("All nonces fetched!");

    nonces.forEach((nonce, i) => {
        userNoncesArray[i] = nonce
    });

    console.log("Staking tokens on accounts...");
    const keyPairs = new Map<number, KeyringPair>();
    for (let seed = 0; seed < USERS_COUNT; seed++) {
        keyPairs.set(seed, keyring.addFromUri(stringSeed(seed)));
    }

    for (let seed = firstSeed; seed <= lastSeed; seed += 2) {
        if (seed + 1 > lastSeed)
            break;
        await bond(
            keyPairs,
            userNoncesArray,
            api,
            seed,
            seed + 1
        );
        await bond(
            keyPairs,
            userNoncesArray,
            api,
            seed + 1,
            seed
        );
    }
    console.log("Staking tokens complete!");

    const usersConfig: UsersConfig = {
        lastSeed,
        firstSeed,
        userNonces,
        totalUsersCount: USERS_COUNT
    };

    return {
        commonConfig,
        moduleConfig,
        usersConfig
    }
};


const constructBench = async (
    {benchConfig}: ConstructBenchArgs<ReturnType<typeof prepare>>) => {

    const {moduleConfig, usersConfig} = benchConfig;

    const {keyring, provider, api} = await initApi(moduleConfig.wsUrl);

    const userNoncesArray = new Int32Array(usersConfig.userNonces);

    const keyPairs = new Map<number, KeyringPair>();
    for (let seed = 0; seed < usersConfig.totalUsersCount; seed++) {
        keyPairs.set(seed, keyring.addFromUri(stringSeed(seed)));
    }

    return {keyring, provider, api, userNoncesArray, usersConfig, keyPairs};
};

const destroyBench = async (
    {}:
        DestroyBenchArgs<ReturnType<typeof prepare>, ReturnType<typeof constructBench>>) => {
};


const getRandomSeed = (usersConfig: UsersConfig): number => {
    let firstSeed = usersConfig.firstSeed;
    let lastSeed = usersConfig.lastSeed;

    return Math.floor(Math.random() * (lastSeed - firstSeed + 1)) + firstSeed;
};


const getRandomSenderSeed = getRandomSeed;

const commitTransaction = async (
    {constructData}:
        CommitTransactionArgs<ReturnType<typeof prepare>, ReturnType<typeof constructBench>>):
    Promise<TransactionResult> => {

    const {usersConfig, keyPairs, userNoncesArray, api} = constructData;

    let senderSeed = getRandomSenderSeed(usersConfig);
    let senderKeyPair = keyPairs.get(senderSeed)!;

    let nonce = Atomics.add(userNoncesArray, senderSeed - usersConfig.firstSeed, 1);

    let bondExtra = api.tx.staking.bondExtra(
        1,
    );

    await bondExtra.signAndSend(senderKeyPair, {nonce: nonce});

    return {code: 10, error: null}
};


export const profile = Profile({
    configSchema,
    prepare,
    destroyBench,
    constructBench,
    commitTransaction
});
