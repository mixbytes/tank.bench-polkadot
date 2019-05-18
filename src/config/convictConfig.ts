import Constants from "../constants/Constants";

const convict = require("convict");

export default function getConvict() {
    return convict(
        {
            wsUrl: {
                arg: 'polkadot.wsUrl',
                format: String,
                default: "ws://127.0.0.1:9944",
                doc: "WS URL"
            },
            creatorAccount: {
                name: {
                    arg: 'creatorAccount.name',
                    format: String,
                    default: "Alice",
                    doc: "Creat"
                },
                privateKey: {
                    arg: 'creatorAccount.privateKey',
                    format: String,
                    default: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3",
                    doc: "the privateKey of account"
                },
            },

            fromAccount: {
                create: {
                    arg: 'fromAccount.create',
                    format: Boolean,
                    default: true,
                    doc: "whether to auto create account or not"
                },
                name: {
                    arg: 'fromAccount.name',
                    format: String,
                    default: "",
                    doc: "the name of account. May be null, then will be generated"
                },
                privateKey: {
                    arg: 'fromAccount.privateKey',
                    format: String,
                    default: "",
                    doc: "the privateKey of account. May be null, then will be generated"
                },
            },

            configFile: {
                arg: 'configFile',
                format: String,
                default: "./polkadot.bench.config.json",
                doc: "Path to config file"
            },

        }
    );
}
