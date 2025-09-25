export type ZeroExQuote = {
  price: string
  guaranteedPrice: string
  to: string
  data: string
  value: string
  buyTokenAddress: string
  sellTokenAddress: string
  buyAmount: string
  sellAmount: string
  allowanceTarget?: string
  sources?: Array<{ name: string; proportion: string }>
  estimatedGas?: string
}

export async function fetchZeroExQuote(params: {
  sellToken: string
  buyToken: string
  sellAmount: string
  takerAddress: string
  apiKey?: string
  chainId?: number
}): Promise<ZeroExQuote> {
  const { sellToken, buyToken, sellAmount, takerAddress, apiKey, chainId } = params
  const base = getZeroExBaseUrl(chainId)
  // Use simple quote endpoint to avoid CORS issues
  const url = new URL(`${base}/swap/v1/quote`)
  url.searchParams.set('sellToken', sellToken)
  url.searchParams.set('buyToken', buyToken)
  url.searchParams.set('sellAmount', sellAmount)
  url.searchParams.set('takerAddress', takerAddress)
  if (chainId) url.searchParams.set('chainId', String(chainId))

  const headers: Record<string, string> = { 'accept': 'application/json' }
  const key = apiKey || import.meta.env.VITE_ZEROEX_API_KEY
  if (key) headers['0x-api-key'] = key as string

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`0x quote error ${res.status}: ${text}`)
  }
  return (await res.json()) as ZeroExQuote
}

function getZeroExBaseUrl(chainId?: number): string {
  // Allow override via env for Monad testnet deployments.
  const override = import.meta.env.VITE_ZEROEX_BASE
  if (override) return override as string
  // Fallbacks for common chains; Monad testnet expected via override like https://swap-api.monad.xyz
  if (!chainId) return 'https://api.0x.org'
  return 'https://api.0x.org'
}


