import { Token } from "./types";

// Maximum uint256 value for ERC-20 allowances
export const MAX_ALLOWANCE = BigInt(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);

export const MONAD_TESTNET_TOKENS: Token[] = [
  {
    chainId: 10143,
    name: "Wrapped MON",
    symbol: "WMON",
    decimals: 18,
    address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
    logoURI:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/I_t8rg_V_400x400.jpg/public",
  },
  {
    chainId: 10143,
    name: "USDT",
    symbol: "USDT",
    decimals: 6,
    address: "0xfBC2D240A5eD44231AcA3A9e9066bc4b33f01149",
    logoURI:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/images.png/public",
  },
  {
    chainId: 10143,
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    address: "0xf817257fed379853cde0fa4f97ab987181b1e5ea",
    logoURI:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/USDC-logo.png/public",
  },
  {
    chainId: 10143,
    name: "DAK",
    symbol: "DAK",
    decimals: 18,
    address: "0x0f0bdebf0f83cd1ee3974779bcb7315f9808c714",
    logoURI:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/DAK-logo.png/public",
  },
  {
    chainId: 10143,
    name: "CHOG",
    symbol: "CHOG",
    decimals: 18,
    address: "0xe0590015a873bf326bd645c3e1266d4db41c4e6b",
    logoURI:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/CHOG-logo.png/public",
  },
  {
    chainId: 10143,
    name: "YAKI",
    symbol: "YAKI",
    decimals: 18,
    address: "0xfe140e1dce99be9f4f15d657cd9b7bf622270c50",
    logoURI:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/YAKI-logo.png/public",
  },
  {
    chainId: 10143,
    name: "KB",
    symbol: "KB",
    decimals: 18,
    address: "0x34d1ae6076aee4072f54e1156d2e507dd564a355",
    logoURI:
      "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/KB-logo.png/public",
  },
];

export const MONAD_TESTNET_TOKENS_BY_SYMBOL: Record<string, Token> =
  MONAD_TESTNET_TOKENS.reduce((acc, token) => {
    acc[token.symbol.toLowerCase()] = token;
    return acc;
  }, {} as Record<string, Token>);

export const MONAD_TESTNET_TOKENS_BY_ADDRESS: Record<string, Token> =
  MONAD_TESTNET_TOKENS.reduce((acc, token) => {
    acc[token.address.toLowerCase()] = token;
    return acc;
  }, {} as Record<string, Token>);

// ✅ Add missing exports
export const AFFILIATE_FEE = 5; // 50 bps = 0.5%
export const FEE_RECIPIENT = "0xa28639d4C874D9b3f75031F7bfd20d223404c8C8"; // Replace with your address
export const MIN_TRADE_AMOUNT = "0.0001"; // Minimum trade amount
