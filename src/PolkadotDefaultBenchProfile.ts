import {BenchProfile, BuiltinBenchProfile} from "tank.bench-common";
import {Keyring} from "@polkadot/keyring";
import {ApiPromise, WsProvider} from "@polkadot/api";
import {KeyringPair} from "@polkadot/keyring/types";
import {Balance, Index} from "@polkadot/types";
import BN = require("bn.js");

const TOKENS_TO_SEND = 1;
const TRANS_FROM_ONE_USER = 254;
const USERS_COUNT = 1000;

export default class PolkadotDefaultBenchProfile extends BenchProfile {

    static readonly profileMeta: BuiltinBenchProfile = {
        fileName: __filename,
        name: "default"
    };

    private api!: ApiPromise;
    private keyring!: Keyring;

    private currentSenderKeyringPair!: KeyringPair;
    private currentSenderSeed!: number;
    private currentSenderNonce!: Index;
    private currentSenderSent!: number;

    private balances: Map<number, number> = new Map<number, number>();

    private firstSeed = 0;
    private lastSeed = USERS_COUNT - 1;

    private threadId!: number;

    // noinspection JSMethodCanBeStatic
    private stringSeed(seed: number): string {
        return '//user//' + ("0000" + seed).slice(-4);
    }

    // noinspection JSMethodCanBeStatic
    private getRandomSeed(): number {
        return Math.floor(Math.random() * (this.lastSeed - this.firstSeed + 1)) + this.firstSeed;
    }

    // noinspection JSMethodCanBeStatic
    private getVeryRandomSeed(): number {
        return Math.floor(Math.random() * USERS_COUNT);
    }

    async asyncConstruct(threadId: number) {
        // ed25519 and sr25519
        this.threadId = threadId;
        this.keyring = new Keyring({type: 'sr25519'});
        this.api = await ApiPromise.create(new WsProvider(this.benchConfig.moduleConfig.wsUrl));

        if (this.benchConfig.commonConfig.sharding.shards > 0 && this.benchConfig.commonConfig.sharding.shardId >= 0) {
            let seedsInShard = USERS_COUNT / this.benchConfig.commonConfig.sharding.shards;
            this.firstSeed = Math.floor(seedsInShard * this.benchConfig.commonConfig.sharding.shardId);
            this.lastSeed = Math.floor(this.firstSeed + seedsInShard) - 1
        }

        let seedsInThread = (this.lastSeed - this.firstSeed) / this.benchConfig.commonConfig.threadsAmount;
        if (seedsInThread < 1)
            throw new Error("too many threads for this amount of shards. Not implemented yet");
        this.firstSeed += Math.floor(seedsInThread * threadId);
        this.lastSeed = Math.floor(this.firstSeed + seedsInThread) - 1;

        this.logger.log(`The ${threadId} thread will use ${this.firstSeed}...${this.lastSeed} accounts`);
        await this.chooseNewSender()
    }

    private getRandomReceiverSeed() {
        let seed = this.getVeryRandomSeed();
        if (seed === this.currentSenderSeed)
            seed++;
        if (seed >= USERS_COUNT - 1)
            seed = 0;
        return seed;

    }

    private getRandomSenderSeed() {
        return this.getRandomSeedNotEq(this.currentSenderSeed);
    }

    private getRandomSeedNotEq(old: number) {
        let seed = this.getRandomSeed();
        if (seed === old)
            seed++;
        if (seed > this.lastSeed)
            seed = this.firstSeed;
        return seed;
    }

    async chooseNewSender() {
        this.currentSenderSeed = this.getRandomSenderSeed();

        this.currentSenderKeyringPair = this.keyring.addFromUri(this.stringSeed(this.currentSenderSeed));
        this.currentSenderNonce = <Index>await this.api.query.system.accountNonce(this.currentSenderKeyringPair.address);
        this.currentSenderSent = 0;

        let balance = <Balance>await this.api.query.balances.freeBalance(this.currentSenderKeyringPair.address);
        this.balances.set(this.currentSenderSeed, balance.toNumber());

        this.logger.log(`The ${this.threadId} thread selected ${this.currentSenderSeed} sender. Nonce: ${this.currentSenderNonce.toNumber()}`);

    }

    async commitTransaction(uniqueData: any) {
        if (this.currentSenderSent >= TRANS_FROM_ONE_USER) {
            await this.chooseNewSender()
        }

        let receiverSeed = this.getRandomReceiverSeed();
        let receiverKeyringPair = await this.keyring.addFromUri(this.stringSeed(receiverSeed));

        let amountToSend = TOKENS_TO_SEND;
        this.currentSenderNonce = new Index(this.currentSenderNonce.add(new BN(1)));
        let nonce = this.currentSenderNonce;
        this.currentSenderSent++;

        let transfer = this.api.tx.balances.transfer(receiverKeyringPair.address, amountToSend);
        await transfer.signAndSend(this.currentSenderKeyringPair, {nonce: nonce});

        this.balances.set(this.currentSenderSeed, this.balances.get(this.currentSenderSeed)!! - amountToSend);

        return {code: 10, error: null}

    }
}

