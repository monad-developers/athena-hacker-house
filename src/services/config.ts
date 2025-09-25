/**
 * Environment configuration utility
 * Handles environment variables and API settings
 */

// Environment variable getters with defaults
export const config = {
  // 0x API Configuration
  zeroExApiKey: process.env.NEXT_PUBLIC_ZERO_EX_API_KEY,
  
  // Chain Configuration
  defaultChainId: parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || '10143', 10),
  
  // Feature Flags
  enableSwapApi: process.env.NEXT_PUBLIC_ENABLE_SWAP_API !== 'false',
  
  // API URLs
  zeroExApiUrl: 'https://api.0x.org',
  
  // Development settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Supported chain IDs and their configurations (0x API compatible testnets only)
export const SUPPORTED_CHAINS = {
  10143: {
    name: 'Monad Testnet',
    symbol: 'MON',
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    blockExplorer: 'https://testnet.monad.xyz',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MON',
      decimals: 18,
    },
  },
  8453: {
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

/**
 * Validate configuration on startup
 */
export function validateConfig() {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check API key
  if (!config.zeroExApiKey) {
    if (config.enableSwapApi) {
      warnings.push('NEXT_PUBLIC_ZERO_EX_API_KEY not found. API calls will fail.');
    }
  }

  // Check chain ID
  if (!SUPPORTED_CHAINS[config.defaultChainId as SupportedChainId]) {
    warnings.push(`Default chain ID ${config.defaultChainId} is not supported.`);
  }

  // Log warnings and errors
  if (warnings.length > 0) {
    console.warn('Configuration warnings:', warnings);
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:', errors);
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }

  return { warnings, errors };
}

/**
 * Get chain configuration by ID
 */
export function getChainConfig(chainId: number) {
  return SUPPORTED_CHAINS[chainId as SupportedChainId];
}

/**
 * Check if API is properly configured
 */
export function isApiConfigured(): boolean {
  return Boolean(config.zeroExApiKey && config.enableSwapApi);
}

// Validate configuration on module load in development
if (config.isDevelopment) {
  validateConfig();
}