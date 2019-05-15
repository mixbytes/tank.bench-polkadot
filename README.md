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
docker run --rm -it --network host chevdor/polkadot:0.3.14 polkadot --chain=local --validator -d /tmp/alice key AAA --rpc-external --ws-external
```

Run benchmark
```
node dist/index.js                                                                                                                                                       
``

