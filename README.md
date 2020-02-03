# tank.bench-polkadot

This repository contains profiles that are used to bench polkadot nodes

### Configuration schema
MixBytes.Tank ansible binding for Polkadot provides only WebSocket url to connect to nodes,
so module config schema looks like this:

```typescript
const configSchema = {
    wsUrl: {
        arg: 'polkadot.wsUrl',
        format: String,
        default: "",
        doc: "WS URL"
    },
};
```
