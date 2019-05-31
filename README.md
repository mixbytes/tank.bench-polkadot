# tank.bench-polkadot


Benchmarking and profiling module for polkadot blockchain, designed to use with MixBytes Tank - a tool for benchmarking, stress testing and profiling decentralized services. Can be used standalone as profiling tool or part of CI.

This is an utility for becnhmarking blockchain transactions performance and emulate user's activity in decentralized network. This benchmark is used for emulation of real network behaviour in situations close to real life, for finding performance bottlenecks and simulating DoS attacks.

Utility includes classes, allowing to write your own test scenarios or modify existing.

## Description

Benchmark connects to polkadot node, set in config file, uses pack of pre-set accounts and sends funds randomly between them. Parameters of this accounts pack (keys, seeds) depends on used blockchain node. Benchmark use a base NPM module ```tank.bench-common```, that runs benchmark and send metrics to metrics collector (Prometheus).


## Install and run


Clone repo
```
git clone https://github.com/mixbytes/tank.bench-polkadot.git
cd tank.bench-polkadot
```

Install Node modules
```
npm install
```

Compile TypeScript without errors
```
npx tsc
```

By default benchmark uses local node and WebSockets endpoint 'ws:127.0.0.1:9944'. To run local polkadot node in docker use command:
```
docker run --rm -it --network host mixbytes/polkadot:eenae-bench-0.4 polkadot --chain bench --validator --key //Alice --ws-external
```

Run benchmark
```
node dist/index.js
```
Run benchmark after successful compilation of TypeScript (after changes in benchmark code):
```
npx tsc && node dist/index.js
```

## Configuration and customisation

Blockchain-specific paramters reside in ```polkadot.bench.config.json``` config, for example enpoint of blockchain node(```"wsUrl": "ws://127.0.0.1:9944"``` in our case).

Parameters, controlling amount of transactions, threads and other common for benchmarks parameters reside in ```bench.config.json```. use this config to control amount of transactions, threads, active promises, etc.

To change benchmark behaviour, write you own custom logic in ```src/steps/src/steps/PolkadotModule*Step.ts```

