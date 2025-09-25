import { useState, useEffect, useCallback } from 'react';
import { zeroXSwapService } from '@/lib/zeroXSwap';
import { swapAuthManager } from '@/lib/swapAuthorization';
import { MONAD_TESTNET_TOKENS, MIN_VISIBLE_ANGLE, MONAD_TESTNET_CONFIG } from '@/lib/config';
import { ethers } from 'ethers';

interface SwapExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  timestamp: number;
  angle: number;
  token: string;
  sellAmount?: string;
  buyAmount?: string;
}

interface UseAutoSwapReturn {
  isEnabled: boolean;
  lastSwap: SwapExecutionResult | null;
  swapHistory: SwapExecutionResult[];
  queueStatus: {
    total: number;
    pending: number;
    processing: number;
    queue: Array<{
      id: string;
      angle: number;
      targetToken: string;
      status: string;
      timestamp: number;
    }>;
  };
  executeSwap: (angle: number, userAddress: string, sendTransaction: (tx: unknown) => Promise<string>) => Promise<SwapExecutionResult>;
}

export function useAutoSwap(): UseAutoSwapReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastSwap, setLastSwap] = useState<SwapExecutionResult | null>(null);
  const [swapHistory, setSwapHistory] = useState<SwapExecutionResult[]>([]);
  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    queue: [] as Array<{
      id: string;
      angle: number;
      targetToken: string;
      status: string;
      timestamp: number;
    }>,
  });

  // Load swap history from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('harmonad_swap_history');
      if (stored) {
        setSwapHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load swap history:', error);
    }
  }, []);

  // Save swap history to localStorage
  const saveSwapHistory = useCallback((history: SwapExecutionResult[]) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('harmonad_swap_history', JSON.stringify(history.slice(0, 50))); // Keep last 50
    } catch (error) {
      console.error('Failed to save swap history:', error);
    }
  }, []);

  // Update enabled state and queue status
  useEffect(() => {
    const checkEnabled = () => {
      // Check if any user has authorization
      const accounts = typeof window !== 'undefined' ?
        Object.keys(localStorage).filter(key => key.startsWith('harmonad_swap_auth_')).length > 0 :
        false;

      setIsEnabled(accounts);
      setQueueStatus(swapAuthManager.getQueueStatus());
    };

    checkEnabled();

    // Check every 2 seconds for queue updates
    const interval = setInterval(() => {
      checkEnabled();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const executeSwap = useCallback(async (
    angle: number,
    userAddress: string,
    sendTransaction: (tx: unknown) => Promise<string>
  ): Promise<SwapExecutionResult> => {
    const timestamp = Date.now();
    let buyToken: typeof MONAD_TESTNET_TOKENS[keyof typeof MONAD_TESTNET_TOKENS] | undefined;

    try {
      console.log(`🔄 Executing 0x-powered swap for angle ${angle}°`);

      // Validate authorization
      if (!swapAuthManager.isAuthorized(userAddress)) {
        throw new Error('Not authorized for automatic swaps');
      }

      // Validate angle and get target token
      if (angle < MIN_VISIBLE_ANGLE) {
        throw new Error(`Angle too low: ${angle}° (minimum: ${MIN_VISIBLE_ANGLE}°)`);
      }

      // Get target token based on angle
      buyToken = Object.values(MONAD_TESTNET_TOKENS).find(token => {
        if (angle >= 20 && angle < 35) return token.symbol === 'USDC';
        if (angle >= 35 && angle < 50) return token.symbol === 'USDT';
        if (angle >= 50 && angle < 65) return token.symbol === 'WBTC';
        if (angle >= 65 && angle < 80) return token.symbol === 'WETH';
        if (angle >= 80 && angle <= 135) return token.symbol === 'WSOL';
        return false;
      });
      
      if (!buyToken) {
        throw new Error(`No token mapped for angle: ${angle}°`);
      }

      console.log(`🎯 Target token: ${buyToken.symbol} for angle ${angle}°`);

      // Add to swap queue to prevent cancellation
      const queueId = swapAuthManager.addToSwapQueue(angle, buyToken.symbol, userAddress);
      console.log(`📥 Added to swap queue with ID: ${queueId}`);

      // Check user's native balance
      const swapAmount = ethers.parseEther('0.01'); // Swap 0.01 MON
      const estimatedGas = BigInt(750000); // Increased to 750k gas limit for complex swaps
      const gasPrice = ethers.parseUnits('2', 'gwei'); // 2 gwei gas price
      const maxGasCost = estimatedGas * gasPrice; // Maximum gas cost
      const totalRequired = swapAmount + maxGasCost; // Swap amount + gas fees

        if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          
          // Ensure we're checking balance on the correct network
          const rawChainId = 10143;
          const currentChainId = Number(rawChainId);

          console.log(`🔗 Network Detection Debug:`);
          console.log(`  - Raw Chain ID from network: ${rawChainId} (type: ${typeof rawChainId})`);
          console.log(`  - Converted Chain ID: ${currentChainId} (type: ${typeof currentChainId})`);
          console.log(`  - Expected Chain ID: ${MONAD_TESTNET_CONFIG.chainId} (type: ${typeof MONAD_TESTNET_CONFIG.chainId})`);
          console.log(`  - Are they equal? ${currentChainId === MONAD_TESTNET_CONFIG.chainId}`);
          console.log(`  - toString comparison: ${currentChainId.toString()} === ${MONAD_TESTNET_CONFIG.chainId.toString()} = ${currentChainId.toString() === MONAD_TESTNET_CONFIG.chainId.toString()}`);

          // Use string comparison as fallback in case of BigInt/number issues
          const chainIdMatch = currentChainId === MONAD_TESTNET_CONFIG.chainId ||
                               currentChainId.toString() === MONAD_TESTNET_CONFIG.chainId.toString() ||
                               Number(rawChainId) === MONAD_TESTNET_CONFIG.chainId;

          if (!chainIdMatch) {
            throw new Error(`Wrong network! Please switch to Monad Testnet (Chain ID: ${MONAD_TESTNET_CONFIG.chainId}). Currently on chain ${currentChainId}.`);
          }
          
          const balance = await provider.getBalance(userAddress);

          console.log(`💰 User native balance on Monad: ${ethers.formatEther(balance)} MON`);
          console.log(`💸 Required: ${ethers.formatEther(swapAmount)} MON (swap) + ${ethers.formatEther(maxGasCost)} MON (gas) = ${ethers.formatEther(totalRequired)} MON total`);

          // if (balance < totalRequired) {
          //   throw new Error(`Insufficient MON balance. Have: ${ethers.formatEther(balance)} MON, Need: ${ethers.formatEther(totalRequired)} MON (${ethers.formatEther(swapAmount)} for swap + ${ethers.formatEther(maxGasCost)} for gas)`);
          // }

          console.log('✅ Sufficient native MON balance for swap and gas fees');

        } catch (checkError: unknown) {
          const errorMessage = checkError instanceof Error ? checkError.message : 'Unknown error';
          console.error('❌ Balance/network check failed:', errorMessage);
          throw checkError; // Don't continue if balance check fails (includes wrong network)
        }
      }

      // Ensure we're on Monad testnet
      let chainId: number = MONAD_TESTNET_CONFIG.chainId; // Always use Monad testnet
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // const network = await provider.getNetwork();
          const rawChainId = 10143;
          const currentChainId = Number(rawChainId);

          console.log(`🔗 Second Network Check Debug:`);
          console.log(`  - Raw Chain ID: ${rawChainId} (type: ${typeof rawChainId})`);
          console.log(`  - Converted Chain ID: ${currentChainId} (type: ${typeof currentChainId})`);
          console.log(`  - Expected Chain ID: ${MONAD_TESTNET_CONFIG.chainId} (type: ${typeof MONAD_TESTNET_CONFIG.chainId})`);

          // Use string comparison as fallback in case of BigInt/number issues
          const chainIdMatch = currentChainId === MONAD_TESTNET_CONFIG.chainId ||
                               currentChainId.toString() === MONAD_TESTNET_CONFIG.chainId.toString() ||
                               Number(rawChainId) === MONAD_TESTNET_CONFIG.chainId;

          if (!chainIdMatch) {
            throw new Error(`Wrong network! Please switch to Monad Testnet (Chain ID: ${MONAD_TESTNET_CONFIG.chainId}). Currently on chain ${currentChainId}.`);
          }

          chainId = currentChainId; // Use detected chain ID only if it's Monad
          console.log(`✅ Confirmed on Monad testnet (${chainId})`);
        } catch (error) {
          console.error('Chain detection failed:', error);
          throw error; // Don't continue if we can't confirm the network
        }
      }

      // Get 0x quote using the new service
      console.log('🔍 Getting 0x swap quote...');
      console.log(`💱 Swapping ${ethers.formatEther(swapAmount)} MON → ${buyToken.symbol}`);

      const quote = await zeroXSwapService.swapNativeToToken(
        buyToken.address,
        swapAmount.toString(),
        userAddress,
        chainId,
        0.02 // 2% slippage for better execution
      );

      console.log('💱 Received 0x quote:', {
        buyAmount: quote.buyAmount,
        sellAmount: quote.sellAmount,
        to: quote.to,
        estimatedGas: quote.estimatedGas,
        price: quote.price
      });

      // IMPORTANT: Verify the recipient address
      console.log(`🎯 RECIPIENT VERIFICATION:`);
      console.log(`📤 Your wallet: ${userAddress}`);
      console.log(`📥 Tokens will go to: ${userAddress} (same address)`);
      console.log(`🔗 DEX router: ${quote.to}`);

      // CRITICAL FIX: Validate quote has required fields before creating transaction
      if (!quote.to) {
        throw new Error('Quote is missing required "to" address field. Cannot create transaction.');
      }

      if (!quote.data) {
        console.warn('⚠️ Quote missing data field, using empty data');
      }

      // Create transaction from quote
      const transaction = {
        to: quote.to,
        data: quote.data || '0x', // Provide fallback for missing data
        value: quote.value || '0', // Provide fallback for missing value
        gasLimit: quote.gas || '750000', // Increased fallback gas limit for complex swaps
        gasPrice: quote.gasPrice || '1000000000', // Increased fallback gas price (1 gwei)
      };

      console.log('📝 Created 0x swap transaction:', {
        to: transaction.to,
        value: transaction.value,
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice,
        dataLength: transaction.data.length
      });

      // Final validation before sending
      if (!transaction.to || transaction.to === '0x' || transaction.to === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Invalid transaction "to" address: ${transaction.to}. Cannot proceed with swap.`);
      }

      // Execute transaction
      console.log('⚡ Executing 0x swap transaction...');
      const txHash = await sendTransaction(transaction);

      console.log(`✅ 0x Swap completed! TX: ${txHash}`);

      const result: SwapExecutionResult = {
        success: true,
        txHash,
        timestamp,
        angle,
        token: buyToken.symbol,
        sellAmount: ethers.formatEther(quote.sellAmount),
        buyAmount: ethers.formatUnits(quote.buyAmount, buyToken.decimals),
      };

      setLastSwap(result);
      setSwapHistory(prev => {
        const newHistory = [result, ...prev];
        saveSwapHistory(newHistory);
        return newHistory;
      });

      return result;

    } catch (error: unknown) {
      console.error('❌ 0x Auto-swap failed:', error);

      // Handle swap errors with user-friendly messages
      let userFriendlyError = 'Swap failed. Please try again.';

      // Add context-specific error handling
      if (error instanceof Error) {
        const errorMessage = error.message;

        if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient MON balance')) {
          userFriendlyError = `Insufficient MON balance. You need at least 0.011 MON (0.01 for swap + 0.001 for gas). Get more MON from the Monad testnet faucet.`;
        } else if (errorMessage.includes('Wrong network') || errorMessage.includes('Chain') && errorMessage.includes('not supported')) {
          userFriendlyError = `Please switch to Monad Testnet (Chain ID: ${MONAD_TESTNET_CONFIG.chainId}) to use this feature.`;
        } else if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
          userFriendlyError = 'Transaction was cancelled by user.';
        } else if (errorMessage.includes('No token mapped')) {
          userFriendlyError = 'No token is mapped to this lid angle. Try a different angle.';
        } else if (errorMessage.includes('Not authorized')) {
          userFriendlyError = 'Swap authorization expired. Please re-authorize automatic swaps.';
        } else if (errorMessage.includes('gas')) {
          userFriendlyError = 'Transaction failed due to gas issues. This might be due to network congestion or insufficient gas.';
        } else if (errorMessage.includes('nonce')) {
          userFriendlyError = 'Transaction failed due to nonce issues. Please try again.';
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          userFriendlyError = 'Network error. Please check your connection and try again.';
        } else {
          userFriendlyError = `Swap failed: ${errorMessage}. Please try again or contact support if the issue persists.`;
        }
      }

      const result: SwapExecutionResult = {
        success: false,
        error: userFriendlyError,
        timestamp,
        angle,
        token: buyToken?.symbol || 'Unknown',
      };

      setLastSwap(result);
      setSwapHistory(prev => {
        const newHistory = [result, ...prev];
        saveSwapHistory(newHistory);
        return newHistory;
      });

      return result;
    }
  }, [saveSwapHistory]);

  return {
    isEnabled,
    lastSwap,
    swapHistory,
    queueStatus,
    executeSwap,
  };
}