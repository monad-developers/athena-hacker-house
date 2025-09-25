export type QuizAnswer = {
  risk: 'low' | 'medium' | 'high'
  horizon: 'short' | 'medium' | 'long'
  vibe: 'serious' | 'balanced' | 'degen'
  // Optional UI-driven extras
  sector?: 'memes' | 'bluechips' | 'stables' | 'narratives'
  volatility?: 'low' | 'medium' | 'high'
  frequency?: 'scalp' | 'swing' | 'position'
  chainPref?: 'monad' | 'eth' | 'alt'
}

export type TokenProfile = {
  symbol: string
  name: string
  bio: string
  liquidity: 'High' | 'Medium' | 'Low'
  feeBps: number
  vector: number[]
}

// Simple trait encoding: [risk, volatility, memeScore, stability, yieldBias]
export const TOKENS: TokenProfile[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    bio: 'The steady date — I like stability and long nights hodling.',
    liquidity: 'High',
    feeBps: 5,
    vector: [0.4, 0.4, 0.2, 0.8, 0.5],
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    bio: 'The sensible one — Perfect for short date nights. No surprises.',
    liquidity: 'High',
    feeBps: 1,
    vector: [0.1, 0.1, 0.0, 1.0, 0.3],
  },
  {
    symbol: 'PEPE',
    name: 'PEPE',
    bio: 'The crazy one — Loud, meme-y and might moon. Bring snacks.',
    liquidity: 'Medium',
    feeBps: 30,
    vector: [0.9, 0.95, 1.0, 0.1, 0.4],
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    bio: 'The practical date — dependable and everywhere.',
    liquidity: 'High',
    feeBps: 1,
    vector: [0.1, 0.1, 0.0, 1.0, 0.3],
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    bio: 'The OG — slow and steady, big energy.',
    liquidity: 'Medium',
    feeBps: 5,
    vector: [0.5, 0.5, 0.1, 0.7, 0.4],
  },
  {
    symbol: 'WSOL',
    name: 'Wrapped SOL',
    bio: 'The sprinter — fast moves and sunny vibes.',
    liquidity: 'Medium',
    feeBps: 5,
    vector: [0.6, 0.6, 0.2, 0.6, 0.5],
  },
]

export function userVectorFromAnswers(a: QuizAnswer): number[] {
  const risk = a.risk === 'low' ? 0.2 : a.risk === 'medium' ? 0.5 : 0.9
  const volatility = risk
  const meme = a.vibe === 'serious' ? 0.1 : a.vibe === 'balanced' ? 0.5 : 0.95
  const stability = 1 - volatility * 0.8
  const yieldBias = a.horizon === 'short' ? 0.3 : a.horizon === 'medium' ? 0.6 : 0.8
  return [risk, volatility, meme, stability, yieldBias]
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
  const magA = Math.hypot(...a)
  const magB = Math.hypot(...b)
  return magA && magB ? dot / (magA * magB) : 0
}

export function scoreTokens(userVec: number[]): { token: TokenProfile; score: number }[] {
  return TOKENS.map((t) => ({ token: t, score: cosineSimilarity(userVec, t.vector) }))
    .sort((x, y) => y.score - x.score)
}

// -----------------------------
// Discrete survey weighting model (custom token list from user)
// -----------------------------

type Percent = number // 0-100
export type DiscreteToken = {
  symbol: string
  name: string
  weights: {
    risk: { low: Percent; medium: Percent; high: Percent }
    horizon: { short: Percent; medium: Percent; long: Percent }
    vibe: { serious: Percent; balanced: Percent; degen: Percent }
  }
}

// Update swipe cards to supported Monad tokens so we can swap reliably
export const DISCRETE_TOKENS: DiscreteToken[] = [
  { symbol: 'WMON', name: 'Wrapped MON', weights: { risk: { low: 20, medium: 60, high: 20 }, horizon: { short: 20, medium: 60, long: 20 }, vibe: { serious: 30, balanced: 50, degen: 20 } } },
  { symbol: 'WOOL', name: 'Wrapped WOOL', weights: { risk: { low: 40, medium: 50, high: 10 }, horizon: { short: 30, medium: 50, long: 20 }, vibe: { serious: 35, balanced: 50, degen: 15 } } },
  { symbol: 'USDC', name: 'USD Coin', weights: { risk: { low: 80, medium: 20, high: 0 }, horizon: { short: 60, medium: 35, long: 5 }, vibe: { serious: 70, balanced: 30, degen: 0 } } },
  { symbol: 'USDT', name: 'Tether USD', weights: { risk: { low: 80, medium: 20, high: 0 }, horizon: { short: 60, medium: 35, long: 5 }, vibe: { serious: 60, balanced: 35, degen: 5 } } },
  { symbol: 'WETH', name: 'Wrapped ETH', weights: { risk: { low: 30, medium: 60, high: 10 }, horizon: { short: 20, medium: 50, long: 30 }, vibe: { serious: 50, balanced: 45, degen: 5 } } },
  { symbol: 'WBTC', name: 'Wrapped BTC', weights: { risk: { low: 30, medium: 60, high: 10 }, horizon: { short: 15, medium: 40, long: 45 }, vibe: { serious: 60, balanced: 35, degen: 5 } } },
  { symbol: 'WSOL', name: 'Wrapped SOL', weights: { risk: { low: 25, medium: 60, high: 15 }, horizon: { short: 25, medium: 55, long: 20 }, vibe: { serious: 40, balanced: 50, degen: 10 } } },
]

export function scoreDiscreteTokens(a: QuizAnswer): { symbol: string; name: string; scorePct: number }[] {
  // Base from risk/horizon/vibe
  const base = DISCRETE_TOKENS.map((t) => {
    const r = t.weights.risk[a.risk]
    const h = t.weights.horizon[a.horizon]
    const v = t.weights.vibe[a.vibe]
    const baseScore = (r + h + v) / 3 // 0..100

    // Bonuses from extra answers (lightweight heuristic)
    let bonus = 0
    // Sector fit
    const sectorFit: Record<string, string[]> = {
      memes: ['WMON', 'WOOL', 'WSOL'],
      bluechips: ['WETH', 'WBTC'],
      stables: ['USDC', 'USDT'],
      narratives: ['WMON', 'WSOL', 'WETH'],
    }
    if (a.sector && sectorFit[a.sector]?.includes(t.symbol)) bonus += 12

    // Volatility tolerance
    const volMap: Record<string, string[]> = {
      low: ['USDC', 'USDT'],
      medium: ['WETH', 'WBTC', 'WOOL'],
      high: ['WMON', 'WSOL'],
    }
    if (a.volatility && volMap[a.volatility]?.includes(t.symbol)) bonus += 8

    // Trade frequency
    const freqMap: Record<string, string[]> = {
      scalp: ['WMON', 'WSOL'],
      swing: ['WOOL', 'WETH'],
      position: ['WBTC', 'USDC', 'USDT'],
    }
    if (a.frequency && freqMap[a.frequency]?.includes(t.symbol)) bonus += 6

    // Chain preference: light bias to WMON if monad
    if (a.chainPref === 'monad' && (t.symbol === 'WMON' || t.symbol === 'WOOL')) bonus += 4

    const finalScore = Math.min(100, Math.round(baseScore + bonus))
    return { symbol: t.symbol, name: t.name, scorePct: finalScore }
  })

  return base.sort((x, y) => y.scorePct - x.scorePct)
}

import { MONAD_ADDRESSES } from '../../lib/monad'

export const SYMBOL_TO_ADDRESS: Record<string, string> = {
  MON: 'MON', // native
  WMON: MONAD_ADDRESSES.WMON,
  WOOL: '', // TODO: provide when available
  USDC: MONAD_ADDRESSES.USDC,
  USDT: MONAD_ADDRESSES.USDT,
  WETH: MONAD_ADDRESSES.WETH,
  WBTC: MONAD_ADDRESSES.WBTC,
  WSOL: MONAD_ADDRESSES.WSOL,
}

export const TOKEN_META: Record<string, { tagline: string; blurb?: string; gradient: string; imageUrl?: string }> = {
  WMON: {
    tagline: 'The mysterious new kid on the block 👀 … fast, smooth, and ready to take you places.',
    blurb: 'Monad’s native wrapper. Low latency, high throughput vibes. Suits risk-on explorers who want speed with some structure.',
    gradient: 'from-black via-indigo-900 to-purple-700',
    imageUrl: '/wmon.png',
  },
  WOOL: {
    tagline: 'Fluffy but don’t be fooled 🐑 — I keep it cozy while stacking gains.',
    blurb: 'Soft exterior, sturdy core. Leans mid-volatility and comfy holds; perfect for swing dates and chill yields.',
    gradient: 'from-rose-100 via-pink-100 to-pink-300',
  },
  WETH: {
    tagline: 'Classic, reliable, and everyone’s type 😏 … but I still know how to keep it wild.',
    blurb: 'OG blue-chip energy. Liquid, deep, and everywhere. For balanced players who still enjoy momentum.',
    gradient: 'from-blue-900 via-slate-700 to-slate-400',
    imageUrl: '/weth.png',
  },
  USDT: {
    tagline: 'Stable in the sheets, wild in the streets 💵. Always there when you need me.',
    blurb: 'Battle-tested stable. Park funds, rotate fast. Great when the date is risk-off but you still want options.',
    gradient: 'from-emerald-700 via-green-600 to-lime-500',
    imageUrl: '/usdt.png',
  },
  USDC: {
    tagline: 'Clean, regulated, and drama-free 😇 … I’m the one you take home to your parents.',
    blurb: 'Pristine and predictable. Premium stable liquidity for strategic rotations and precise sizing.',
    gradient: 'from-sky-700 via-blue-700 to-indigo-800',
    imageUrl: '/usdc.png',
  },
  WSOL: {
    tagline: 'The sprinter — fast moves and sunny vibes.',
    blurb: 'Sun-kissed speedster. Suits scalp-to-swing flow with energetic markets and fast lanes.',
    gradient: 'from-orange-700 via-amber-600 to-yellow-500',
    imageUrl: '/WSOL.png',
  },
}


