export const MONAD_TESTNET = {
  chainId: 10143,
  name: 'Monad Testnet',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  explorer: 'https://testnet.monadexplorer.com',
  token: { symbol: 'MON', decimals: 18 },
}

export const MONAD_ADDRESSES = {
  UniswapV2Factory: '0x733e88f248b742db6c14c0b1713af5ad7fdd59d0',
  UniswapV2Router02: '0xfb8e1c3b833f9e67a71c859a132cf783b645e436',
  WMON: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  USDC: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  WETH: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
  USDT: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
  WBTC: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d',
  WSOL: '0x5387C85A4965769f6B0Df430638a1388493486F1',
}

// Token list for 0x symbol mapping; extend as we verify addresses
export const MONAD_TOKENS: Record<string, string> = {
  MON: 'MON',
  WMON: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  USDC: '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea',
  USDT: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
  WETH: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
  WBTC: '0xcf5a6076cfa32686c0Df13aBaDa2b40dec133F1d',
  WSOL: '0x5387C85A4965769f6B0Df430638a1388493486F1',
}

export const DEFAULT_RPC = import.meta.env.VITE_MONAD_RPC || MONAD_TESTNET.rpcUrl


