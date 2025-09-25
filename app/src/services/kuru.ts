// Minimal Kuru.io Swap API client (testnet-friendly)
// Assumes Kuru provides standard quote and swap endpoints that return transaction data
// You can set VITE_KURU_API (e.g., https://api.kuru.io) and VITE_KURU_API_KEY in your env

export type KuruQuote = {
  price: string
  buyAmount: string
  sellAmount: string
  estimatedGas?: string
}

export type KuruSwapTx = {
  to: string
  data: `0x${string}`
  value?: string
}

// Default to Kuru testnet endpoint; can be overridden via VITE_KURU_API
const BASE = (import.meta as any).env.VITE_KURU_API || 'https://api.testnet.kuru.io'
// Kuru testnet may not require an API key. If provided, we'll forward it.
const API_KEY = (import.meta as any).env.VITE_KURU_API_KEY

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'accept': 'application/json' }
  if (API_KEY) h['x-api-key'] = API_KEY
  return h
}

export async function kuruQuote(params: {
  chainId: number
  sellToken: string // address or symbol per Kuru API
  buyToken: string
  amount: string // in wei
  taker?: string
}): Promise<KuruQuote> {
  const url = new URL(`${BASE}/v1/quote`)
  url.searchParams.set('chainId', String(params.chainId))
  url.searchParams.set('sellToken', params.sellToken)
  url.searchParams.set('buyToken', params.buyToken)
  url.searchParams.set('amount', params.amount)
  if (params.taker) url.searchParams.set('taker', params.taker)

  const res = await fetch(url.toString(), { headers: headers() })
  if (!res.ok) throw new Error(`Kuru quote ${res.status}`)
  return (await res.json()) as KuruQuote
}

export async function kuruSwapTx(params: {
  chainId: number
  sellToken: string
  buyToken: string
  amount: string // in wei
  taker: string
  slippageBps?: number
}): Promise<KuruSwapTx> {
  const url = new URL(`${BASE}/v1/swap`)
  url.searchParams.set('chainId', String(params.chainId))
  url.searchParams.set('sellToken', params.sellToken)
  url.searchParams.set('buyToken', params.buyToken)
  url.searchParams.set('amount', params.amount)
  url.searchParams.set('taker', params.taker)
  if (params.slippageBps != null) url.searchParams.set('slippageBps', String(params.slippageBps))

  const res = await fetch(url.toString(), { headers: headers() })
  if (!res.ok) throw new Error(`Kuru swap ${res.status}`)
  return (await res.json()) as KuruSwapTx
}


