'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { MONAD_TESTNET_CONFIG } from './config';

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css';

// Create a custom Monad testnet chain configuration
const monadTestnet = {
  id: MONAD_TESTNET_CONFIG.chainId,
  name: MONAD_TESTNET_CONFIG.name,
  nativeCurrency: MONAD_TESTNET_CONFIG.nativeCurrency,
  rpcUrls: {
    default: { http: [MONAD_TESTNET_CONFIG.rpcUrl] },
    public: { http: [MONAD_TESTNET_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: MONAD_TESTNET_CONFIG.blockExplorerUrl },
  },
  testnet: true,
} as const;

// Configure RainbowKit
const config = getDefaultConfig({
  appName: 'Harmonad',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '8b123c4d5e6f7a8b9c0d1e2f3a4b5c6d', // WalletConnect project ID
  chains: [monadTestnet],
  ssr: false, // Disable SSR for better compatibility
});

// Create a client with proper defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
