import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  base,
} from 'wagmi/chains';

// Custom Monad testnet chain (supported by 0x API)
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
    public: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Testnet Explorer', url: 'https://testnet.monad.xyz' },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'SwapInAd',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  chains: [monadTestnet, base], // Primary: Monad testnet, Secondary: Base mainnet
  ssr: true, // If your dApp uses server side rendering (SSR)
});

// Chain configurations matching our token data
export const supportedChains = [monadTestnet, base];

// Helper to get chain by ID
export function getChainById(chainId: number) {
  return supportedChains.find(chain => chain.id === chainId);
}