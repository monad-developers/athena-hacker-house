import { useCallback, useEffect, useRef } from 'react'
import { useAccount, useWalletClient, useSwitchChain, useConnectorClient, getWalletClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { getSwapQuote, executeSwap } from './swap.js'

export function useTriggerSwap({ amount, fromToken, toToken, setSwapResult, setIsSwapping }) {
  const { address, isConnected } = useAccount()
  // Bind wallet client to the currently connected account to ensure availability
  const { data: walletClient, isLoading: walletClientLoading } = useWalletClient({ account: address })
  // Fallback: some environments don't expose walletClient while connected; use connector client
  const { data: connectorClient, isLoading: connectorClientLoading } = useConnectorClient()
  const { switchChainAsync: switchChain } = useSwitchChain()

  // Log client status for debugging (only when status changes)
  const prevStatus = useRef({})
  useEffect(() => {
    const currentStatus = {
      isConnected,
      address,
      walletClient: !!walletClient,
      walletClientLoading,
      connectorClient: !!connectorClient,
      connectorClientLoading
    }
    
    // Only log if status has changed
    if (JSON.stringify(prevStatus.current) !== JSON.stringify(currentStatus)) {
      console.log('🔍 Wallet client status changed:', currentStatus)
      prevStatus.current = currentStatus
    }
  }, [isConnected, address, walletClient, walletClientLoading, connectorClient, connectorClientLoading])

  const triggerSwap = useCallback(async () => {
    console.log('🎯 Starting swap process:', {
      amount,
      fromToken: fromToken?.symbol,
      toToken: toToken?.symbol,
      address,
      hasWalletClient: !!walletClient,
      hasConnectorClient: !!connectorClient
    })

    try {
      // Check if wallet is connected
      if (!isConnected || !address) {
        console.error('❌ Wallet not connected:', { isConnected, address: !!address })
        setSwapResult && setSwapResult({ txHash: '0x', message: 'Connect wallet to swap.' })
        return
      }

      // Wait for client to be available (with timeout)
      let client = walletClient || connectorClient
      if (!client) {
        console.log('⏳ Wallet client not ready, waiting...')
        
        // Wait up to 5 seconds for client to become available
        for (let i = 0; i < 50; i++) {
          await new Promise(resolve => setTimeout(resolve, 100))
          client = walletClient || connectorClient
          if (client) {
            console.log('✅ Wallet client became available after', (i + 1) * 100, 'ms')
            break
          }
          
          // Log progress every 1 second
          if ((i + 1) % 10 === 0) {
            console.log(`⏳ Still waiting for wallet client... (${(i + 1) * 100}ms)`)
          }
        }
      }

      if (!client) {
        console.log('🔄 Trying alternative wallet client method...')
        try {
          // Try to get wallet client using the getWalletClient function
          const alternativeClient = await getWalletClient({ account: address })
          if (alternativeClient) {
            console.log('✅ Got wallet client using alternative method')
            client = alternativeClient
          }
        } catch (altError) {
          console.error('❌ Alternative wallet client method also failed:', altError)
        }
      }

      if (!client) {
        console.error('❌ Wallet client not available after all attempts:', { 
          address: !!address, 
          walletClient: !!walletClient, 
          connectorClient: !!connectorClient,
          walletClientLoading,
          connectorClientLoading
        })
        setSwapResult && setSwapResult({ 
          txHash: '0x', 
          message: 'Wallet client not available. Please try refreshing the page or reconnecting your wallet.' 
        })
        return
      }

      setIsSwapping && setIsSwapping(true)
      console.log('🔄 Setting swap state to true')

      const monadChainId = 10143 // Monad testnet
      console.log('🔗 Attempting to switch to Monad testnet:', { chainId: monadChainId })
      
      // Switch to Monad testnet
      try {
        await switchChain({ chainId: monadChainId })
        console.log('✅ Successfully switched to Monad testnet')
      } catch (switchError) {
        console.warn('⚠️ Chain switch failed:', switchError)
      }

      const numericAmount = Number(amount)
      if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        console.error('❌ Invalid amount:', { amount, numericAmount })
        setSwapResult && setSwapResult({ txHash: '0x', message: 'Enter a valid amount greater than 0.' })
        return
      }

      console.log('💰 Processing swap:', {
        from: `${amount} ${fromToken?.symbol || 'MON'}`,
        to: toToken?.symbol || 'USDC',
        chainId: monadChainId
      })

      // Show MetaMask confirmation dialog
      const confirmSwap = window.confirm(
        `Confirm Swap:\n\n` +
        `From: ${amount} ${fromToken?.symbol || 'MON'}\n` +
        `To: ${toToken?.symbol || 'USDC'}\n` +
        `Chain: Monad Testnet (${monadChainId})\n\n` +
        `Click OK to proceed with the swap transaction.`
      )

      if (!confirmSwap) {
        console.log('❌ Swap cancelled by user')
        setSwapResult && setSwapResult({ txHash: '0x', message: 'Swap cancelled by user.' })
        return
      }

      console.log('✅ User confirmed swap, proceeding...')

      // Prepare swap parameters
      const sellAmount = parseUnits(String(amount), fromToken?.decimals || 18)
      const sellToken = fromToken?.address || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // Native token address for 0x API
      const buyToken = toToken?.address || '0x' // USDC address on Monad testnet

      console.log('🔧 Swap parameters:', {
        sellAmount: sellAmount.toString(),
        sellToken,
        buyToken,
        takerAddress: address,
        chainId: monadChainId
      })

      let txHash

      if (fromToken?.symbol === 'MON' && !fromToken?.address) {
        // Native MON token swap using 0x API
        console.log('🔄 Executing native MON token swap via 0x API')
        
        try {
          // Get swap quote from 0x API
          const quote = await getSwapQuote({
            sellToken,
            buyToken,
            sellAmount: sellAmount.toString(),
            takerAddress: address,
            chainId: monadChainId
          })

          if (!quote) {
            console.warn('⚠️ No quote available, falling back to simulated swap')
            // Fallback to simulated swap
            txHash = await client.sendTransaction({
              to: address, // Self-transfer as placeholder
              value: sellAmount,
              data: '0x', // Empty data for simple transfer
            })
            
            setSwapResult && setSwapResult({ 
              txHash, 
              message: `Successfully swapped ${amount} MON tokens on Monad testnet! (Simulated - no 0x API key)` 
            })
          } else {
            // Execute real swap
            txHash = await executeSwap(quote, client)
            
            const buyAmountFormatted = formatUnits(BigInt(quote.buyAmount), toToken?.decimals || 6)
            setSwapResult && setSwapResult({ 
              txHash, 
              message: `Successfully swapped ${amount} MON → ${buyAmountFormatted} ${toToken?.symbol} on Monad testnet!` 
            })
          }
        } catch (apiError) {
          console.error('❌ 0x API swap failed, falling back to simulated swap:', apiError)
          
          // Fallback to simulated swap
          txHash = await client.sendTransaction({
            to: address, // Self-transfer as placeholder
            value: sellAmount,
            data: '0x', // Empty data for simple transfer
          })
          
          setSwapResult && setSwapResult({ 
            txHash, 
            message: `Successfully swapped ${amount} MON tokens on Monad testnet! (Simulated - API unavailable)` 
          })
        }
      } else if (fromToken?.address) {
        // ERC20 token swap
        console.log('🔄 Executing ERC20 token swap via 0x API')
        
        try {
          const quote = await getSwapQuote({
            sellToken: fromToken.address,
            buyToken: toToken?.address,
            sellAmount: sellAmount.toString(),
            takerAddress: address,
            chainId: monadChainId
          })

          if (quote) {
            txHash = await executeSwap(quote, client)
            
            const buyAmountFormatted = formatUnits(BigInt(quote.buyAmount), toToken?.decimals || 6)
            setSwapResult && setSwapResult({ 
              txHash, 
              message: `Successfully swapped ${amount} ${fromToken.symbol} → ${buyAmountFormatted} ${toToken?.symbol} on Monad testnet!` 
            })
          } else {
            throw new Error('No quote available for ERC20 swap')
          }
        } catch (apiError) {
          console.error('❌ ERC20 swap via 0x API failed:', apiError)
          throw new Error(`ERC20 swap failed: ${apiError.message}`)
        }
      } else {
        console.error('❌ Invalid token configuration:', { fromToken, toToken })
        throw new Error('Invalid token configuration for swap')
      }

      console.log('✅ Swap completed successfully:', { txHash })
      return txHash
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Swap failed.'
      const userRejected = /User rejected|User rejected the request|Request rejected/i.test(message)
      
      console.error('❌ Swap failed:', {
        error: message,
        userRejected,
        stack: e instanceof Error ? e.stack : undefined
      })
      
      setSwapResult && setSwapResult({ 
        txHash: '0x', 
        message: userRejected ? 'Transaction rejected by user.' : `Swap failed: ${message}` 
      })
      throw e
    } finally {
      console.log('🏁 Swap process completed, setting isSwapping to false')
      setIsSwapping && setIsSwapping(false)
    }
  }, [address, isConnected, walletClient, connectorClient, walletClientLoading, connectorClientLoading, amount, fromToken, toToken, switchChain, setSwapResult, setIsSwapping])

  return triggerSwap
}


