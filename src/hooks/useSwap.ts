"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useBalance, useChainId, useSwitchChain } from "wagmi";
import { SwapStep, Token, SwapState, SwapQuote } from "@/types/swap";
import {
  fetchSwapPrice,
  fetchSwapQuote,
  parseTokenAmount,
  ZeroExApiError,
} from "@/services/zeroExApi";
import { config } from "@/services/config";
import { DEFAULT_FROM_TOKEN, DEFAULT_TO_TOKEN } from "@/services/tokenData";
import { useSwapExecution } from "./useSwapExecution";

export const useSwap = () => {
  // Wallet hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Swap execution
  const {
    isExecuting,
    executionProgress,
    executionResult,
    executeSwapTransaction,
    resetExecution,
  } = useSwapExecution();

  // UI State
  const [activeTab, setActiveTab] = useState("Swap");
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Default Monad testnet tokens (MON → USDC, both on Monad testnet)
  const defaultFromToken = DEFAULT_FROM_TOKEN; // MON (native) on Monad testnet
  const defaultToToken = DEFAULT_TO_TOKEN; // USDC on Monad testnet

  // Swap State
  const [swapState, setSwapState] = useState<SwapState>({
    fromToken: defaultFromToken,
    toToken: defaultToToken,
    fromAmount: "",
    toAmount: "",
    exchangeRate: null,
    priceImpact: null,
    estimatedGas: null,
    isLoadingPrice: false,
    priceError: null,
    quote: null,
    isLoadingQuote: false,
    quoteError: null,
  });

  // Get token balance
  const { data: fromTokenBalance } = useBalance({
    address,
    token:
      swapState.fromToken?.address ===
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        ? undefined
        : (swapState.fromToken?.address as `0x${string}`),
  });

  const { data: toTokenBalance } = useBalance({
    address,
    token:
      swapState.toToken?.address ===
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        ? undefined
        : (swapState.toToken?.address as `0x${string}`),
  });

  const steps: SwapStep[] = [
    {
      id: 1,
      title: "Human Proof-of-Work",
      icon: "�",
      description: "Clap detection & drawing challenge",
    },
    {
      id: 2,
      title: "Gas Fee Roulette",
      icon: "🎰",
      description: "Spinning the wheel of destiny",
    },
    {
      id: 3,
      title: "Community Validation",
      icon: "🗳️",
      description: "3 random validators deciding...",
    },
    {
      id: 4,
      title: "Elton's Pizza Approval",
      icon: "🍕",
      description: "Elton is chewing... please wait",
    },
    {
      id: 5,
      title: "Transaction Complete",
      icon: "✅",
      description: "Swap executed successfully",
    },
    {
      id: 6,
      title: "NFT Badge Reward",
      icon: "🏆",
      description: "I Survived The Swap!",
    },
  ];

  // Debounce price fetching (useRef to avoid render loops)
  const priceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!swapState.fromToken || !swapState.toToken || !swapState.fromAmount) {
      return;
    }

    if (!config.zeroExApiKey) {
      setSwapState((prev) => ({
        ...prev,
        priceError: "API key not configured",
      }));
      return;
    }

    const fromAmountNumber = parseFloat(swapState.fromAmount.replace(/,/g, ""));
    if (isNaN(fromAmountNumber) || fromAmountNumber <= 0) {
      return;
    }

    setSwapState((prev) => ({
      ...prev,
      isLoadingPrice: true,
      priceError: null,
    }));

    try {
      const sellAmount = parseTokenAmount(
        fromAmountNumber.toString(),
        swapState.fromToken.decimals
      );

      const priceResponse = await fetchSwapPrice(
        {
          chainId: chainId,
          buyToken: swapState.toToken.address,
          sellToken: swapState.fromToken.address,
          sellAmount,
          taker: address,
        },
        config.zeroExApiKey
      );

      // Calculate display amounts
      const buyAmountFormatted = (
        parseFloat(priceResponse.buyAmount) /
        Math.pow(10, swapState.toToken.decimals)
      ).toFixed(6);

      const exchangeRate = (
        (parseFloat(priceResponse.buyAmount) /
          parseFloat(priceResponse.sellAmount)) *
        Math.pow(10, swapState.fromToken.decimals - swapState.toToken.decimals)
      ).toFixed(6);

      setSwapState((prev) => ({
        ...prev,
        toAmount: parseFloat(buyAmountFormatted).toLocaleString(),
        exchangeRate: `1 ${prev.fromToken?.symbol} = ${exchangeRate} ${prev.toToken?.symbol}`,
        estimatedGas: priceResponse.estimatedGas,
        isLoadingPrice: false,
      }));
    } catch (error) {
      console.error("Price fetch error:", error);
      setSwapState((prev) => ({
        ...prev,
        isLoadingPrice: false,
        priceError:
          error instanceof ZeroExApiError
            ? error.message
            : "Failed to fetch price",
      }));
    }
  }, [
    swapState.fromToken,
    swapState.toToken,
    swapState.fromAmount,
    address,
    chainId,
  ]);

  const fetchQuote = useCallback(async (): Promise<SwapQuote | null> => {
    if (
      !swapState.fromToken ||
      !swapState.toToken ||
      !swapState.fromAmount ||
      !address
    ) {
      return null;
    }

    if (!config.zeroExApiKey) {
      setSwapState((prev) => ({
        ...prev,
        quoteError: "API key not configured",
      }));
      return null;
    }

    if (!isConnected) {
      setSwapState((prev) => ({
        ...prev,
        quoteError: "Please connect your wallet",
      }));
      return null;
    }

    setSwapState((prev) => ({
      ...prev,
      isLoadingQuote: true,
      quoteError: null,
    }));

    try {
      const fromAmountNumber = parseFloat(
        swapState.fromAmount.replace(/,/g, "")
      );
      const sellAmount = parseTokenAmount(
        fromAmountNumber.toString(),
        swapState.fromToken.decimals
      );

      const quote = await fetchSwapQuote(
        {
          chainId: chainId,
          buyToken: swapState.toToken.address,
          sellToken: swapState.fromToken.address,
          sellAmount,
          taker: address,
        },
        config.zeroExApiKey
      );

      setSwapState((prev) => ({
        ...prev,
        quote,
        isLoadingQuote: false,
      }));

      return quote;
    } catch (error) {
      console.error("Quote fetch error:", error);
      setSwapState((prev) => ({
        ...prev,
        isLoadingQuote: false,
        quoteError:
          error instanceof ZeroExApiError
            ? error.message
            : "Failed to fetch quote",
      }));
      return null;
    }
  }, [
    swapState.fromToken,
    swapState.toToken,
    swapState.fromAmount,
    address,
    chainId,
    isConnected,
  ]);

  // Debounced price fetching
  useEffect(() => {
    if (priceTimeoutRef.current) {
      clearTimeout(priceTimeoutRef.current);
    }

    if (swapState.fromAmount && swapState.fromToken && swapState.toToken) {
      const timeout = setTimeout(() => {
        fetchPrice();
      }, 500); // 500ms debounce
      priceTimeoutRef.current = timeout;
    }

    return () => {
      if (priceTimeoutRef.current) {
        clearTimeout(priceTimeoutRef.current);
        priceTimeoutRef.current = null;
      }
    };
  }, [
    swapState.fromAmount,
    swapState.fromToken,
    swapState.toToken,
    fetchPrice,
  ]);

  const setFromToken = useCallback((token: Token) => {
    setSwapState((prev) => ({
      ...prev,
      fromToken: token,
      quote: null,
    }));
  }, []);

  const setToToken = useCallback((token: Token) => {
    setSwapState((prev) => ({
      ...prev,
      toToken: token,
      quote: null,
    }));
  }, []);

  const setFromAmount = useCallback((amount: string) => {
    setSwapState((prev) => ({
      ...prev,
      fromAmount: amount,
      quote: null,
    }));
  }, []);

  const switchTokens = useCallback(() => {
    setSwapState((prev) => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
      quote: null,
    }));
  }, []);

  const resetSwap = useCallback(() => {
    // Reset to default Monad testnet tokens
    const defaultFromToken = DEFAULT_FROM_TOKEN; // MON (native) on Monad testnet
    const defaultToToken = DEFAULT_TO_TOKEN; // USDC on Monad testnet

    setSwapState({
      fromToken: defaultFromToken,
      toToken: defaultToToken,
      fromAmount: "",
      toAmount: "",
      exchangeRate: null,
      priceImpact: null,
      estimatedGas: null,
      isLoadingPrice: false,
      priceError: null,
      quote: null,
      isLoadingQuote: false,
      quoteError: null,
    });
    resetExecution();
    setCurrentStep(1);
  }, [resetExecution]);

  const handleStepClick = useCallback(
    (stepId: number) => {
      // Only allow going back to previous steps, not forward
      if (stepId <= currentStep && !isProcessing) {
        setCurrentStep(stepId);
      }
    },
    [currentStep, isProcessing]
  );

  const executeSwap = useCallback(async () => {
    const quote = await fetchQuote();
    if (quote && swapState.fromToken) {
      const result = await executeSwapTransaction(quote, swapState.fromToken);
      return result;
    }
    return null;
  }, [fetchQuote, swapState.fromToken, executeSwapTransaction]);

  const handleNextStep = useCallback(() => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handleSwap = useCallback(() => {
    if (currentStep === 1) {
      handleNextStep();
    }
  }, [currentStep, handleNextStep]);

  return {
    // State
    fromAmount: swapState.fromAmount,
    toAmount: swapState.toAmount,
    fromToken: swapState.fromToken,
    toToken: swapState.toToken,
    exchangeRate: swapState.exchangeRate,
    priceImpact: swapState.priceImpact,
    estimatedGas: swapState.estimatedGas,
    quote: swapState.quote,

    // Wallet state
    isConnected,
    address,
    chainId,
    fromTokenBalance,
    toTokenBalance,

    // Loading states
    isLoadingPrice: swapState.isLoadingPrice,
    isLoadingQuote: swapState.isLoadingQuote,
    isProcessing: isProcessing || isExecuting,

    // Swap execution
    isExecuting,
    executionProgress,
    executionResult,

    // Errors
    priceError: swapState.priceError,
    quoteError: swapState.quoteError,

    // UI State
    activeTab,
    setActiveTab,
    currentStep,
    setCurrentStep,
    setIsProcessing,
    steps,

    // Actions
    setFromToken,
    setToToken,
    setFromAmount,
    switchTokens,
    resetSwap,
    fetchPrice,
    fetchQuote,
    executeSwap,
    handleStepClick,
    handleNextStep,
    handleSwap,
    switchChain,
  };
};
