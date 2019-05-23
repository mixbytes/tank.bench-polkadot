# tank.bench-polkadot

Benchmark for polkadot common module blockchain.

This is an util for becnhmarking blockchain transactions performance.

## Install and run

### \[TEMP\] \[TEMP\]


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




