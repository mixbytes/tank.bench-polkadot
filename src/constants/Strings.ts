const Strings = {
    log: {

        preparingAccounts: () =>
            `   Preparing accounts to work with...`,

        creatingAccountForRole: (role: string) =>
            `       Creating ${role} account...`,

        preparingWithoutCreationAccountForRole: (role: string) =>
            `   Preparing ${role} account (without creation)...`,

        accountGottenFromConfigWithKeys: (role: string, account: { privateKey: string, publicKey: string, name: string }) =>
            `   ${role} account "${account.name}" is gotten from config file:\n` +
            `       privateKey: ${account.privateKey}\n` +
            `       publicKey:  ${account.publicKey}`,

        accountGottenFromConfig: (role: string, account: { privateKey: string, publicKey: string, name: string }) =>
            `   ${role} account "${account.name}" is gotten from config file (no keys needed)`,

        nameForRoleGenerated: (role: string, account: { privateKey: string, publicKey: string, name: string }) =>
            `       Generated name for ${role} account: "${account.name}"`,

        keysForAccountGenerated: (role: string, account: { privateKey: string, publicKey: string, name: string }) =>
            `       Generated keys for ${role} account "${account.name}":\n` +
            `           privateKey: ${account.privateKey}\n` +
            `           publicKey:  ${account.publicKey}`,


        accountsPrepared: () =>
            `   Accounts successfully prepared.`,


        deployingTokenContract: () =>
            `   Deploying token contract (wasm + abi)...`,

        deployingTokenContractNotNeeded: () =>
            `   Deploying token contract not needed (specified in config file)`,


        creatingTokens: (tokens: string) =>
            `   Creating tokens (${tokens})...`,

        creatingTokensNotNeeded: () =>
            `   Creating tokens not needed (specified in config file)`,


        issuingTokens: (tokens: string) =>
            `   Issuing tokens (${tokens})...`,

        issuingTokensNotNeeded: () =>
            `   Issuing tokens not needed (specified in config file)`,


        benchmarkPreparedWithTransaction: () =>
            `   Benchmark prepared, committed prepare transactions`,

        benchmarkPreparedNoTransaction: () =>
            `   Benchmark prepared, no prepare transaction needed.`,

    },

    error: {
        notCreateButNoName: (role: string) =>
            `If you don't want to auto create the ${role} account, ` +
            `you need to specify it's name and key in config file.`,
        notCreateButNoKey: (role: string) =>
            `If you don't want to auto create the ${role} account, ` +
            `you need to specify it's key in config file.`
    },
};

export default Strings;
