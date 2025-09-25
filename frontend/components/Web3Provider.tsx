"use client";

import { useEffect } from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

// Monad Testnet Chain Configuration
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet-explorer.monad.xyz' },
  },
  testnet: true,
} as const;

// Create config as singleton to prevent multiple WalletConnect initializations
let wagmiConfig: ReturnType<typeof createConfig> | null = null;

const getWagmiConfig = () => {
  if (!wagmiConfig) {
    wagmiConfig = createConfig(
      getDefaultConfig({
        enableFamily: false,
        chains: [monadTestnet, mainnet], // Monad testnet as primary, mainnet as fallback

        walletConnectProjectId:
          process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",

        appName: "Token Crunchies",

        appDescription: "Hunt QR codes, earn tokens, get rewards at Athena Hackerhouse",
        appUrl: "https://token-crunchies.vercel.app",
        appIcon: "https://token-crunchies.vercel.app/logo.png",
        
        // Configure for better UX - prevent auto-reconnection issues
        ssr: true,
      })
    );
  }
  return wagmiConfig;
};

// Create QueryClient as singleton
let queryClientInstance: QueryClient | null = null;

const getQueryClient = () => {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          // Prevent refetching on window focus in development
          refetchOnWindowFocus: process.env.NODE_ENV === 'production',
          // Prevent retries in development to avoid multiple WalletConnect inits
          retry: process.env.NODE_ENV === 'production' ? 3 : false,
          // Reduce stale time in development
          staleTime: process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 0,
        },
      },
    });
  }
  return queryClientInstance;
};

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  // Use singleton instances to prevent multiple WalletConnect initializations
  const config = getWagmiConfig();
  const queryClient = getQueryClient();

  // Suppress WalletConnect double initialization warning in development
  // This is expected behavior in React Strict Mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (args[0]?.includes?.('WalletConnect Core is already initialized')) {
          return; // Suppress this specific warning
        }
        originalWarn.apply(console, args);
      };

      // Cleanup function to restore original console.warn
      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="retro"
          customTheme={{
            "--ck-font-family": "var(--font-head)",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
