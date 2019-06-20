const { ApiPromise, WsProvider } = require('@polkadot/api');
import {BenchStep} from "tank.bench-common";

const { Keyring } = require('@polkadot/keyring');
const testKeyring = require('@polkadot/keyring/testing');
const { hexToU8a, bufferToU8a } = require('@polkadot/util');
const { randomAsU8a, blake2AsHex } = require('@polkadot/util-crypto');
const { BN }  = require('bn.js');


export default class PolkadotModuleBenchStep extends BenchStep {
    private api?: any;
    private keyring?: any;
    private sender_account_keypair?: any;
    private current_sender: any = '';
    private current_sender_nonces: any = [];
    private current_sender_seed: string = '';
    private current_seed: string = '0';
    private current_seed_base: string = '//user//';
    private current_amounts: any = [];
    
    async timeout(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
    }
    async asyncConstruct() {
        //this.keyring = new testKeyring.default();
        // ed25519 and sr25519
        this.keyring = new Keyring({ type: 'sr25519' });
        this.api = await ApiPromise.create(new WsProvider(this.benchConfig.wsUrl));

        // choose one of pre-defined accounts with funds like "//user//0789"
        let this_benchmark_seed = Math.floor(Math.random() * 1000 / 2);

        this.current_sender_seed = this.current_seed_base + ("000" + this_benchmark_seed).slice(-4);
        this.current_seed = this.getRandomReceiverSeed(this.current_sender_seed);

        this.current_sender = await this.keyring.addFromUri(this.current_sender_seed);
        this.current_sender_nonces[this.current_sender_seed] = await this.api.query.system.accountNonce(this.current_sender.address());

        this.current_amounts[this.current_sender_seed] = await this.api.query.balances.freeBalance(this.current_sender.address())

    }

    next_sender_seed(seed: string) {
        // to get next sender form current pre-defined accounts
        let intt = parseInt(seed.replace(/[^0-9]/g, ''), 10);
		intt++;
        intt = intt % 1000;
        return this.current_seed_base + ("000" + intt).slice(-4);
    }
    
    getRandomReceiverSeed(senderSeed: string) {
        let seed: string = this.current_seed_base + ("000" + Math.floor(Math.random() * 1000)).slice(-4);
        while (seed == senderSeed) {
            seed = this.current_seed_base + ("000" + Math.floor(Math.random() * 1000)).slice(-4);
        }
        return seed;
    }

    async commitBenchmarkTransaction(uniqueData: any) {

        // switch to next sender after all funds of current_sender finished
        if (!(this.current_sender_seed in this.current_amounts) || this.current_amounts[this.current_sender_seed] <= 1) {

            this.current_sender_seed = await this.next_sender_seed(this.current_sender_seed);
            this.current_sender = await this.keyring.addFromUri(this.current_sender_seed);
        	this.current_sender_nonces[this.current_sender_seed] = await this.api.query.system.accountNonce(this.current_sender.address());
			this.current_amounts[this.current_sender_seed] = await this.api.query.balances.freeBalance(this.current_sender.address());
        }
        
        
        this.current_amounts[this.current_sender_seed] = Math.floor(this.current_amounts[this.current_sender_seed] / 2);


        this.current_seed  = this.getRandomReceiverSeed(this.current_sender_seed);
        let receiver = await this.keyring.addFromUri(this.current_seed);
        let previous = await this.api.query.balances.freeBalance(receiver.address());
        let sender_balance = await this.api.query.balances.freeBalance(this.current_sender.address());
		this.current_sender_nonces[this.current_sender_seed]++;

        try {
            // now useless
            let signed_tx = this.api.tx.balances.transfer(receiver.address(), this.current_amounts[this.current_sender_seed])
            	.sign(this.current_sender, { nonce: this.current_sender_nonces[this.current_sender_seed] });
            console.log('[DEBUG] Prepared TX: nonce: ' + this.current_sender_nonces[this.current_sender_seed] + ', from: ' + this.current_sender_seed + '(balance: ' + sender_balance + '), to ' + this.current_seed + ", sending " + this.current_amounts[this.current_sender_seed] );
            return await this.api.tx.balances.transfer(receiver.address(), this.current_amounts[this.current_sender_seed])
											.sign(this.current_sender, { nonce: this.current_sender_nonces[this.current_sender_seed] })
											.send((result: any) => {
                                        console.log('[DEBUG] Status of TX: nonce: ' + this.current_sender_nonces[this.current_sender_seed] + ', from: ' + this.current_sender_seed + '(balance: ' + sender_balance + '), to ' + this.current_seed + ", sending " + this.current_amounts[this.current_sender_seed] + ", status: " + result.status);
  									if (result.status === 'Finalized') {
                                        console.log('[DEBUG] Finalized! TX: nonce: ' + this.current_sender_nonces[this.current_sender_seed] + ', from: ' + this.current_sender_seed + '(balance: ' + sender_balance + '), to ' + this.current_seed + ", sending " + this.current_amounts[this.current_sender_seed] + ", tx: " + result.status.asFinalised.toHex());
										return result.status.asFinalised.toHex();
  									}
								});

        } catch(e) {
        	console.log("[ERROR] BenchmarkStep: " + e);
        	throw e; // let caller know the promise was rejected with this reason
    	}
		
    }
}

