"use client";

import { ReactNode, useMemo } from "react";
import { WagmiProvider, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { Chain } from "viem";

type WalletProvidersProps = {
  children: ReactNode;
};

const monadChainId = Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || 10143);
const monadRpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://monad-testnet.rpc.thirdweb.com";

export const monad: Chain = {
  id: monadChainId,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [monadRpcUrl] },
    public: { http: [monadRpcUrl] },
  },
};

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!walletConnectProjectId) {
  // Surface a clear error in development so we don't accidentally ship with an invalid project id
  // You can get a project id from WalletConnect Cloud dashboard
  console.error(
    "WalletConnect projectId is missing. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your env."
  );
}

const wagmiConfig = getDefaultConfig({
  appName: "Monad Swap",
  projectId: walletConnectProjectId ?? "", // require a real project id; empty string avoids using the demo id
  chains: [monad, mainnet],
  transports: {
    [monad.id]: http(monadRpcUrl),
    [mainnet.id]: http(),
  },
  ssr: true,
});

export default function WalletProviders({ children }: WalletProvidersProps) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} initialChain={monad}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}


