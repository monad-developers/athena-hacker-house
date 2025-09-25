'use client';

import { useState, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { SwapQuote, Token } from '@/types/swap';
import { executeSwap, SwapExecutionProgress, SwapExecutionResult } from '@/services/swapExecution';

export interface UseSwapExecutionReturn {
  isExecuting: boolean;
  executionProgress: SwapExecutionProgress | null;
  executionResult: SwapExecutionResult | null;
  executeSwapTransaction: (quote: SwapQuote, fromToken: Token) => Promise<SwapExecutionResult>;
  resetExecution: () => void;
}

export function useSwapExecution(): UseSwapExecutionReturn {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState<SwapExecutionProgress | null>(null);
  const [executionResult, setExecutionResult] = useState<SwapExecutionResult | null>(null);

  const executeSwapTransaction = useCallback(async (
    quote: SwapQuote,
    fromToken: Token
  ): Promise<SwapExecutionResult> => {
    if (!isConnected) {
      const error = { success: false, error: 'Wallet not connected' };
      setExecutionResult(error);
      return error;
    }

    setIsExecuting(true);
    setExecutionResult(null);
    setExecutionProgress(null);

    try {
      const result = await executeSwap(quote, fromToken, (progress) => {
        setExecutionProgress(progress);
      });

      setExecutionResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setExecutionResult(errorResult);
      return errorResult;
    } finally {
      setIsExecuting(false);
    }
  }, [isConnected]);

  const resetExecution = useCallback(() => {
    setIsExecuting(false);
    setExecutionProgress(null);
    setExecutionResult(null);
  }, []);

  return {
    isExecuting,
    executionProgress,
    executionResult,
    executeSwapTransaction,
    resetExecution,
  };
}