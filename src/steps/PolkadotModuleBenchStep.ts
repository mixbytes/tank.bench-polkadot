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
    
    private last_nonce: any[] = [];
    private pair_index: number = 0;

    private current_sender: any = '';
    private current_sender_nonce: number = 0;
    private current_sender_seed: string = '';
    private current_seed: string = '0';
    private current_seed_base: string = '//user//';
    private current_amount: number = 0;
    
    async timeout(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
    }
    async asyncConstruct() {
        //this.keyring = new testKeyring.default();
        // ed25519 and sr25519
        this.keyring = new Keyring({ type: 'sr25519' });
        this.api = await ApiPromise.create(new WsProvider(this.benchConfig.wsUrl));
        this.last_nonce = [];

        // choose one of pre-defined accounts with funds like "//user//0789"
        let this_benchmark_seed = Math.floor(Math.random() * 1000 / 2);

        this.current_sender_seed = this.current_seed_base + ("000" + this_benchmark_seed).slice(-4);
        this.current_seed = '' + this.current_sender_seed + "00";

        this.current_sender = await this.keyring.addFromUri(this.current_sender_seed);
        this.current_sender_nonce = await this.api.query.system.accountNonce(this.current_sender.address());

        this.current_amount = await this.api.query.balances.freeBalance(this.current_sender.address())
        this.current_amount = Math.floor(this.current_amount / 2);

    }

    next_sender_seed(seed: string) {
        // to get next sender form current pre-defined accounts
        let intt = parseInt(seed.replace(/[^0-9]/g, ''), 10);
		intt++;
		intt = intt % 1000;
        return this.current_seed_base + ("00" + intt).slice(-3);
    }
    
    getRandomReceiverSeed(senderSeed: string) {
        let seed: string = this.current_seed_base + ("000" + Math.floor(Math.random() * 1000)).slice(-4);
        while (seed == senderSeed) {
            seed = this.current_seed_base + ("000" + Math.floor(Math.random() * 1000)).slice(-4);
        }
        return seed;
    }

    async commitBenchmarkTransaction(uniqueData: any) {
        // 
        this.current_amount = Math.floor(this.current_amount / 2);

        // switch to next sender after all funds of current_sender finished
        if (this.current_amount <= 1) {
            this.current_sender_seed = await this.next_sender_seed(this.current_sender_seed);
            this.current_sender = await this.keyring.addFromUri(this.current_sender_seed);
            this.current_sender_nonce = await this.api.query.system.accountNonce(this.current_sender.address());
            this.current_seed  = this.getRandomReceiverSeed(this.current_sender_seed);
			this.current_amount = await this.api.query.balances.freeBalance(this.current_sender.address());
        }

        let receiver = await this.keyring.addFromUri(this.current_seed);
        let previous = await this.api.query.balances.freeBalance(receiver.address());
        this.current_sender_nonce++;
        const tx_id = blake2AsHex(this.current_sender.address() + receiver.address() + this.current_sender_nonce).substr(2, 8);
        
        try {
            // now useless
            let sender_balance = await this.api.query.balances.freeBalance(this.current_sender.address());
            let signed_tx = await this.api.tx.balances.transfer(receiver.address(), this.current_amount)
            	.sign(this.current_sender, { nonce: this.current_sender_nonce });
            let txHash = signed_tx
                            .send()
                .then((txHash: any) => { 
                    //console.log('[DEBUG] TX: ' + tx_id + ', nonce: ' + this.current_sender_nonce + ', from: ' + this.current_sender_seed + '(balance: ' + sender_balance + '), to ' + this.current_seed + ", sending " + this.current_amount + ", txhash received: " + txHash);
				});

			return this.api.query.balances.freeBalance(receiver.address(), (current: any) => {
    					// Calculate the delta
    					const change = current.sub(previous);
						// Only display positive value changes (Since we are pulling `previous` above already,
						// the initial balance change will also be zero)
						if (!change.isZero()) {
							previous = current;
                            console.log('[DEBUG] TX: ' + tx_id + ', nonce: ' + this.current_sender_nonce + ', from: ' + this.current_sender_seed + '(balance: ' + sender_balance + '), to ' + this.current_seed + ", sending " + this.current_amount + ", txhash received: " + txHash + ", balance change: " + change );
                    		return Promise.resolve(txHash);
						}
  					});
        } catch(e) {
        	console.log("[ERROR] BenchmarkStep: " + e);
        	throw e; // let caller know the promise was rejected with this reason
    	}
		
    }
}

