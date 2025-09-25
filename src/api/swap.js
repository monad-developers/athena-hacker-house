// 0x API integration for token swaps on Monad testnet
const ZEROEX_API_BASE = 'https://api.0x.org'

export async function getSwapQuote({
  sellToken,
  buyToken,
  sellAmount,
  takerAddress,
  chainId = 10143 // Monad testnet
}) {
  const apiKey = import.meta.env.VITE_ZEROEX_API_KEY
  
  if (!apiKey) {
    console.warn('0x API key not found in environment variables')
    return null
  }

  const params = new URLSearchParams({
    sellToken,
    buyToken,
    sellAmount,
    takerAddress,
    slippagePercentage: '1', // 1% slippage
    skipValidation: 'true'
  })

  const url = `${ZEROEX_API_BASE}/swap/v1/quote?${params}`
  
  console.log('🔍 Fetching swap quote from 0x API:', {
    url: url.replace(apiKey, '***'),
    params: Object.fromEntries(params)
  })

  try {
    const response = await fetch(url, {
      headers: {
        '0x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 0x API error:', response.status, errorText)
      throw new Error(`0x API error: ${response.status} - ${errorText}`)
    }

    const quote = await response.json()
    console.log('✅ Swap quote received:', {
      sellAmount: quote.sellAmount,
      buyAmount: quote.buyAmount,
      estimatedGas: quote.estimatedGas,
      gasPrice: quote.gasPrice,
      to: quote.to,
      data: quote.data?.slice(0, 10) + '...'
    })

    return quote
  } catch (error) {
    console.error('❌ Failed to get swap quote:', error)
    throw error
  }
}

export async function executeSwap(quote, walletClient) {
  if (!quote || !walletClient) {
    throw new Error('Missing quote or wallet client')
  }

  console.log('🚀 Executing swap transaction:', {
    to: quote.to,
    value: quote.value,
    dataLength: quote.data?.length,
    gasLimit: quote.gas
  })

  try {
    const txHash = await walletClient.sendTransaction({
      to: quote.to,
      value: BigInt(quote.value || '0'),
      data: quote.data,
      gas: BigInt(quote.gas || '500000'),
      gasPrice: BigInt(quote.gasPrice || '1000000000')
    })

    console.log('✅ Swap transaction submitted:', { txHash })
    return txHash
  } catch (error) {
    console.error('❌ Swap transaction failed:', error)
    throw error
  }
}