export type Token = {
  symbol: string;
  address: string;
  decimals: number;
};

export const TOKENS: Token[] = [
  { symbol: "USDT", address: "0x88b8e2161dedc77ef4ab7585569d2415a1c1055d", decimals: 6 },
  { symbol: "USDC", address: "0xf817257fed379853cde0fa4f97ab987181b1e5ea", decimals: 6 },
  { symbol: "DAK", address: "0x0f0bdebf0f83cd1ee3974779bcb7315f9808c714", decimals: 18 },
  { symbol: "CHOG", address: "0xe0590015a873bf326bd645c3e1266d4db41c4e6b", decimals: 18 },
  { symbol: "YAKI", address: "0xfe140e1dce99be9f4f15d657cd9b7bf622270c50", decimals: 18 },
  { symbol: "KB", address: "0x34d1ae6076aee4072f54e1156d2e507dd564a355", decimals: 18 },
];

export const MON = "0x0000000000000000000000000000000000000000";
