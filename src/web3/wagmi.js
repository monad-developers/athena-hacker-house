import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

// Optional Monad chain configuration (driven by env)
const monadChainIdEnv = import.meta.env.VITE_MONAD_CHAIN_ID || import.meta.env.VITE_ZEROEX_CHAIN_ID
const monadRpcUrl = import.meta.env.VITE_MONAD_RPC_URL || ''

// Default Monad testnet configuration
const monadChain = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.monad.xyz'] },
    public: { http: ['https://rpc.testnet.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet-explorer.monad.xyz' },
  },
  testnet: true,
}

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, monadChain],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [monadChain.id]: http(monadChain.rpcUrls.default.http[0]),
  },
  connectors: [
    injected({ shimDisconnect: true }),
  ],
})


