import { useMutation } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { SwapService } from '@/lib/services/swap-service'

export function useSwap() {
  const { address } = useAccount()

  const swapMutation = useMutation({
    mutationFn: async ({
      sellToken,
      buyToken,
      sellAmount,
      opportunityId
    }: {
      sellToken: string
      buyToken: string
      sellAmount: string
      opportunityId: string
    }) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Create headers with wallet authentication
      const headers = {
        'Content-Type': 'application/json',
        'x-wallet-address': address.toLowerCase()
      }

      // First get a quote
      const quoteResponse = await fetch('/api/swap/quote', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sellToken,
          buyToken,
          sellAmount,
          opportunityId
        })
      })

      if (!quoteResponse.ok) {
        const error = await quoteResponse.json()
        throw new Error(error.error || 'Failed to get swap quote')
      }

      const res = await quoteResponse.json()
      const quote = res.quote;

      // Execute the swap
      const executeResponse = await fetch('/api/swap/execute', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          opportunityId,
          quote: {...quote}
        })
      })

      if (!executeResponse.ok) {
        const error = await executeResponse.json()
        throw new Error(error.error || 'Failed to execute swap')
      }

      return executeResponse.json()
    }
  })

  return {
    executeSwap: swapMutation.mutateAsync,
    isLoading: swapMutation.isPending,
    error: swapMutation.error,
    isSuccess: swapMutation.isSuccess,
    data: swapMutation.data
  }
}
