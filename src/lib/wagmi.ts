import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { MONAD_TESTNET } from './config';

// Define Monad testnet chain for wagmi
const monadChain = {
    id: MONAD_TESTNET.chainId,
    name: MONAD_TESTNET.name,
    nativeCurrency: {
        decimals: 18,
        name: MONAD_TESTNET.currency,
        symbol: MONAD_TESTNET.currency,
    },
    rpcUrls: {
        default: { http: [MONAD_TESTNET.rpcUrl] },
        public: { http: [MONAD_TESTNET.rpcUrl] },
    },
    blockExplorers: {
        default: { name: 'Monad Explorer', url: MONAD_TESTNET.explorerUrl },
    },
    testnet: true,
};

export const config = getDefaultConfig({
    appName: 'BatMon dApp',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
    chains: [monadChain],
    ssr: true,
});
