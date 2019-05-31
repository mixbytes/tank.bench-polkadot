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

	getRandomBenchmarkUser() {
		return "//user//" + ("000" + Math.floor(Math.random() * 1000)).slice(-4);
	}

    async asyncConstruct() {
        //this.keyring = new testKeyring.default();
        // ed25519 and sr25519
        this.keyring = new Keyring({ type: 'sr25519' });
        this.api = await ApiPromise.create(new WsProvider(this.benchConfig.wsUrl));
        this.last_nonce = 0;
        this.txs = [];
	
		// account having money on balance
        // this.sender_account_keypair = await this.keyring.addFromUri('//foo');
        // let  sender_balance = await this.api.query.balances.freeBalance(this.sender_account_keypair.address());
        // this.last_nonce = await this.api.query.system.accountNonce(this.sender_account_keypair.address());
        // await console.log("Sender account: " + this.sender_account_keypair.address() + ", balance: " + sender_balance + ", nonce: " + this.last_nonce);
    }


    async commitBenchmarkTransaction(uniqueData: any) {
		// this.last_nonce++;;
		let acc1 = await this.keyring.addFromUri(this.getRandomBenchmarkUser());
		let acc2 = await this.keyring.addFromUri(this.getRandomBenchmarkUser());
		while (acc2.address() == acc1.address()) {
			acc2 = await this.keyring.addFromUri(this.getRandomBenchmarkUser());
		}

		/*
		let b1 = await this.api.query.balances.freeBalance(acc1.address());
        await console.log("Sender account: " + acc1.address() + ", balance: " + b1);
        let b2 = await this.api.query.balances.freeBalance(acc2.address());
        await console.log("Receiver account: " + acc2.address() + ", balance: " + b2);
		*/
		const nonce = new BN(0);//this.last_nonce;
		try {
			await this.api.tx.balances.transfer(acc2.address(), 100 + Math.floor(Math.random() * 666000))
				.sign(acc1, {nonce})
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
			return 200;
		}
		catch (e) {
			return 500;
		}
    }
}

