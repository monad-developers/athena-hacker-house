import contractAbi from './contract-abi.json';

// Monad Testnet Configuration
export const MONAD_TESTNET = {
    chainId: 10143,
    name: 'Monad Testnet',
    currency: 'MON',
    explorerUrl: 'https://testnet.monadexplorer.com',
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    faucetUrl: 'https://faucet.monad.xyz',
};

// Contract Configuration
export const CONTRACT_CONFIG = {
    // Deployed contract address on Monad testnet (v2 with dynamic bet amounts)
    address: '0x3BA83Df250ebFDCEF55D05B148282F84C38949A5',
    abi: contractAbi,
};

// Game Configuration
export const GAME_CONFIG = {
    minBetAmount: '0.001', // 0.001 ETH minimum
    maxBetAmount: '1.0', // 1.0 ETH maximum
    defaultBetAmount: '0.001', // 0.01 ETH default
    minChoice: 1,
    maxChoice: 6,
    winMultiplier: 2,
};

// Wagmi Configuration
export const wagmiConfig = {
    chains: [MONAD_TESTNET],
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
};
