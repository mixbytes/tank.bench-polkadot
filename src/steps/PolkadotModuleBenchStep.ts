const { ApiPromise, WsProvider } = require('@polkadot/api');
import {BenchStep} from "tank.bench-common";

const { Keyring } = require('@polkadot/keyring');
const testKeyring = require('@polkadot/keyring/testing');
const { hexToU8a, bufferToU8a } = require('@polkadot/util');
const { randomAsU8a } = require('@polkadot/util-crypto');
const { BN }  = require('bn.js');


export default class PolkadotModuleBenchStep extends BenchStep {
    private api?: any;
    private keyring?: any;
    private sender_account_keypair?: any;
	private last_nonce?: any;
	private txs?: any[];

	padToFour(number:any) {
		if (number <= 9999) { number = ("000"+number).slice(-4); }
	 	return number;
	}

    async asyncConstruct() {
        //this.keyring = new testKeyring.default();
        // ed25519 and sr25519
        this.keyring = new Keyring({ type: 'sr25519' });
        this.api = await ApiPromise.create(new WsProvider(this.benchConfig.wsUrl));
        this.last_nonce = 0;
        this.txs = [];
	
		// account having money on balance
        this.sender_account_keypair = await this.keyring.addFromUri('//foo');
        let  sender_balance = await this.api.query.balances.freeBalance(this.sender_account_keypair.address());
        this.last_nonce = await this.api.query.system.accountNonce(this.sender_account_keypair.address());
        await console.log("Sender account: " + this.sender_account_keypair.address() + ", balance: " + sender_balance + ", nonce: " + this.last_nonce);
    }


    async commitBenchmarkTransaction(uniqueData: any) {
		let to_account = await this.keyring.addFromSeed(randomAsU8a(32));
		const nonce = this.last_nonce;
		this.last_nonce++;;
		let seed = "//user" + this.padToFour(this.last_nonce);
		await console.log("Nonce: " + this.last_nonce + ", Seed incremented: " + seed);
		
		
		return this.api.tx.balances.transfer(to_account.address(), 123)
					.sign(this.sender_account_keypair, { nonce } )
					.send((result: any) => {
						// Log transfer events
						let events = result.events;
						let status = result.status;
						console.log('Transfer status:', status.type);
						// Log system events once the transfer is finalised
						if (status.isFinalized) {
							console.log('Completed at block hash', status.asFinalized.toHex());
							console.log('Events:');
							events.forEach((item: any) => {
								let phase = item.phase;
								let event = item.event;
								console.log('\t', phase.toString(), `: ${event.section}.${event.method}`, event.data.toString());
							});
						}
					});
							

    }
}

