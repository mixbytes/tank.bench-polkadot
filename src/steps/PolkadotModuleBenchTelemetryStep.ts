const { ApiPromise, WsProvider } = require('@polkadot/api');
import {BenchTelemetryStep} from "tank.bench-common";

const { Keyring } = require('@polkadot/keyring');
const testKeyring = require('@polkadot/keyring/testing');
const { hexToU8a, bufferToU8a } = require('@polkadot/util');
const { randomAsU8a, blake2AsHex } = require('@polkadot/util-crypto');
const { BN }  = require('bn.js');


export default class PolkadotModuleBenchTelemetryStep extends BenchTelemetryStep {
    async asyncConstruct() {
    }
    async onKeyPoint(telemetry: any) {
    }
    async onBenchEnded(d: any) {
    }
}

