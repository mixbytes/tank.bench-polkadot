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

const TOKENS_TO_SEND = 1;
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


// Commit transaction helper functions
const getVeryRandomSeed = (usersConfig: UsersConfig): number => {
    return Math.floor(Math.random() * usersConfig.totalUsersCount);
};

const getRandomSeed = (usersConfig: UsersConfig): number => {
    let firstSeed = usersConfig.firstSeed;
    let lastSeed = usersConfig.lastSeed;

    return Math.floor(Math.random() * (lastSeed - firstSeed + 1)) + firstSeed;
};

const getRandomReceiverSeed = (usersConfig: UsersConfig, senderSeed: number) => {
    let seed = getVeryRandomSeed(usersConfig);
    if (seed === senderSeed)
        seed++;
    if (seed >= usersConfig.totalUsersCount - 1)
        seed = 0;
    return seed;
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

    let receiverSeed = getRandomReceiverSeed(usersConfig, senderSeed);
    let receiverKeyringPair = keyPairs.get(receiverSeed)!;

    let transfer = api.tx.balances.transfer(receiverKeyringPair.address, TOKENS_TO_SEND);
    await transfer.signAndSend(senderKeyPair, {nonce});

    return {code: 10, error: null}
};


export const profile = Profile({
    configSchema,
    prepare,
    destroyBench,
    constructBench,
    commitTransaction
});
