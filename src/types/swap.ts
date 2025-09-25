export type Token = {
  symbol: string;
  address: `0x${string}` | null; // null for native token
  decimals: number;
  zeroExId?: string; // e.g., "ETH" for native
};

export const TOKENS: Token[] = [
  // MON is the native coin on Monad → represent as native (address null)
  { symbol: "MON", address: null, decimals: 18 },
  // USDC on Monad (set via env). Example: export NEXT_PUBLIC_USDC_ADDRESS=0x... in your .env.local
  {
    symbol: "USDC",
    address: (process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined) ?? null,
    decimals: 6,
  },
];

