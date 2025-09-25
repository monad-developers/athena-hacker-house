export const MONAD_TESTNET_CONFIG = {
  chainId: 10143,
  name: 'Monad Testnet',
  rpcUrl: process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz',
  blockExplorerUrl: process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL || 'https://testnet.monadexplorer.com',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
} as const;

// Native token representation for 0x API
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// 0x AllowanceHolder contract address for Monad testnet
export const ALLOWANCE_HOLDER_ADDRESS = '0x0000000000001fF3684f28c67538d4D072C22734';

export const MONAD_TESTNET_TOKENS = {
  MON: {
    address: NATIVE_TOKEN_ADDRESS, // Native token representation
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
    logoURI: '/icons/monad.png'
  },
  WMON: {
    address: '0x760afe86e5de5fa0ee542fc7b7b713e1c5425701', // WrappedMonad (WMON)
    name: 'Wrapped Monad',
    symbol: 'WMON',
    decimals: 18,
    logoURI: '/icons/wmon.png'
  },
  USDC: {
    address: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
    name: 'USD Coin (Testnet)',
    symbol: 'USDC',
    decimals: 6,
    logoURI: '/icons/usdc.png'
  },
  USDT: {
    address: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
    name: 'Tether (Testnet)',
    symbol: 'USDT',
    decimals: 6,
    logoURI: '/icons/usdt.png'
  },
  WBTC: {
    address: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d',
    name: 'Wrapped BTC (Testnet)',
    symbol: 'WBTC',
    decimals: 8,
    logoURI: '/icons/wbtc.png'
  },
  WETH: {
    address: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
    name: 'Wrapped Ethereum (Testnet)',
    symbol: 'WETH',
    decimals: 18,
    logoURI: '/icons/weth.png'
  },
  WSOL: {
    address: '0x5387C85A4965769f6B0Df430638a1388493486F1',
    name: 'Wrapped SOL (Testnet)',
    symbol: 'WSOL',
    decimals: 9,
    logoURI: '/icons/wsol.png'
  }
} as const;

// Legacy support - deprecated, use MONAD_TESTNET_TOKENS instead
export const TESTNET_TOKENS = {
  MONAD: MONAD_TESTNET_TOKENS.WMON.address, // Keep for compatibility
  USDC: MONAD_TESTNET_TOKENS.USDC.address,
  USDT: MONAD_TESTNET_TOKENS.USDT.address,
  WBTC: MONAD_TESTNET_TOKENS.WBTC.address,
  WETH: MONAD_TESTNET_TOKENS.WETH.address,
  WSOL: MONAD_TESTNET_TOKENS.WSOL.address,
} as const;

export const ANGLE_TO_TOKEN_MAPPING = {
  '20-35': MONAD_TESTNET_TOKENS.USDC,
  '35-50': MONAD_TESTNET_TOKENS.USDT,
  '50-65': MONAD_TESTNET_TOKENS.WBTC,
  '65-80': MONAD_TESTNET_TOKENS.WETH,
  '80-135': MONAD_TESTNET_TOKENS.WSOL,
} as const;

export const MIN_VISIBLE_ANGLE = 20;
export const MAX_OPENING_ANGLE = 135;
export const DEBOUNCE_TIME_MS = 3000;

export function getTargetTokenForAngle(angle: number): typeof MONAD_TESTNET_TOKENS[keyof typeof MONAD_TESTNET_TOKENS] | null {
  if (angle < MIN_VISIBLE_ANGLE) return null;

  if (angle >= 20 && angle < 35) return ANGLE_TO_TOKEN_MAPPING['20-35'];
  if (angle >= 35 && angle < 50) return ANGLE_TO_TOKEN_MAPPING['35-50'];
  if (angle >= 50 && angle < 65) return ANGLE_TO_TOKEN_MAPPING['50-65'];
  if (angle >= 65 && angle < 80) return ANGLE_TO_TOKEN_MAPPING['65-80'];
  if (angle >= 80 && angle <= MAX_OPENING_ANGLE) return ANGLE_TO_TOKEN_MAPPING['80-135'];

  return null;
}

export function getAngleRangeForToken(tokenSymbol: string) {
  for (const [range, token] of Object.entries(ANGLE_TO_TOKEN_MAPPING)) {
    if (token.symbol === tokenSymbol) {
      const [min, max] = range.split('-').map(Number);
      return { min, max, range };
    }
  }
  return null;
}