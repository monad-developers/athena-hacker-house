import { Token, Network } from '@/types/swap';

// Popular tokens for each supported chain
export const ETHEREUM_TOKENS: Token[] = [
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // Sepolia WETH
    decimals: 18,
    icon: '⟠',
    backgroundColor: 'bg-blue-500',
    chainId: 11155111,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    decimals: 6,
    icon: '💵',
    backgroundColor: 'bg-blue-400',
    chainId: 11155111,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0', // Sepolia USDT
    decimals: 6,
    icon: '💰',
    backgroundColor: 'bg-green-500',
    chainId: 11155111,
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x53844F9577C2334e541Aec7Df7174ECe5dF1fCf0', // Sepolia DAI
    decimals: 18,
    icon: '◈',
    backgroundColor: 'bg-yellow-500',
    chainId: 11155111,
  },
];

export const BASE_TOKENS: Token[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18,
    icon: '⟠',
    backgroundColor: 'bg-blue-500',
    chainId: 8453,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // Base mainnet USDC
    decimals: 6,
    icon: '💵',
    backgroundColor: 'bg-blue-400',
    chainId: 8453,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x4200000000000000000000000000000000000006', // Base mainnet WETH
    decimals: 18,
    icon: '⟠',
    backgroundColor: 'bg-blue-600',
    chainId: 8453,
  },
];

export const POLYGON_TOKENS: Token[] = [
  {
    symbol: 'MATIC',
    name: 'Polygon',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18,
    icon: '⬟',
    backgroundColor: 'bg-purple-500',
    chainId: 137,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    decimals: 6,
    icon: '💵',
    backgroundColor: 'bg-blue-400',
    chainId: 137,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    decimals: 6,
    icon: '💰',
    backgroundColor: 'bg-green-500',
    chainId: 137,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x7ceb23fd6c5b5f3e657c961e6a9a4b7a0c8b8e8e',
    decimals: 18,
    icon: '⟠',
    backgroundColor: 'bg-blue-600',
    chainId: 137,
  },
];

export const MONAD_TOKENS: Token[] = [
  {
    symbol: 'MON',
    name: 'Monad',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18,
    icon: '🔷',
    backgroundColor: 'bg-indigo-500',
    chainId: 10143,
  },
  {
    symbol: 'WMON',
    name: 'Wrapped Monad',
    address: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', // Placeholder - may need to verify
    decimals: 18,
    icon: '🔷',
    backgroundColor: 'bg-indigo-600',
    chainId: 10143,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea', // Placeholder - may need to verify
    decimals: 6,
    icon: '💵',
    backgroundColor: 'bg-blue-400',
    chainId: 10143,
  },
];

// Network configurations (0x API compatible only)
export const NETWORKS: Record<number, Network> = {
  10143: {
    id: 10143,
    name: 'Monad Testnet',
    icon: '🔷',
    backgroundColor: 'bg-indigo-500',
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    blockExplorer: 'https://testnet.monad.xyz',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MON',
      decimals: 18,
    },
  },
  8453: {
    id: 8453,
    name: 'Base',
    icon: '🔵',
    backgroundColor: 'bg-blue-600',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Token lists by chain (0x API compatible only)
export const TOKENS_BY_CHAIN: Record<number, Token[]> = {
  10143: MONAD_TOKENS, // Primary: Monad testnet
  8453: BASE_TOKENS,   // Secondary: Base mainnet
};

// Helper functions
export function getTokensByChain(chainId: number): Token[] {
  return TOKENS_BY_CHAIN[chainId] || [];
}

export function findToken(chainId: number, addressOrSymbol: string): Token | undefined {
  const tokens = getTokensByChain(chainId);
  return tokens.find(
    token => 
      token.address.toLowerCase() === addressOrSymbol.toLowerCase() ||
      token.symbol.toLowerCase() === addressOrSymbol.toLowerCase()
  );
}

export function getNetwork(chainId: number): Network | undefined {
  return NETWORKS[chainId];
}

// Default tokens for quick access - Monad testnet internal swap
export const DEFAULT_FROM_TOKEN = MONAD_TOKENS[0]; // MON (native) on Monad testnet  
export const DEFAULT_TO_TOKEN = MONAD_TOKENS[2]; // USDC on Monad testnet

// Popular trading pairs (0x API compatible chains only)
export const POPULAR_PAIRS = [
  { from: 'MON', to: 'USDC', chainId: 10143 },  // Monad native to stable (PRIMARY)
  { from: 'MON', to: 'WMON', chainId: 10143 },  // Monad wrap/unwrap
  { from: 'WMON', to: 'USDC', chainId: 10143 }, // Monad wrapped to stable
  { from: 'ETH', to: 'USDC', chainId: 8453 },   // Base mainnet
  { from: 'WETH', to: 'USDC', chainId: 8453 },  // Base wrapped
] as const;