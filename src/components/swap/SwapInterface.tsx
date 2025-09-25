"use client";

import { TokenSelection } from "./TokenSelection";
import { ReviewConfirm } from "./ReviewConfirm";
import { Processing } from "./Processing";
import { PizzaApproval } from "./PizzaApproval";
import { TransactionComplete } from "./TransactionComplete";
import { NFTBadgeReward } from "./NFTBadgeReward";
import { TabNavigation } from "./TabNavigation";

import { Token } from "@/types/swap";

import { SwapExecutionProgress } from "@/services/swapExecution";

interface SwapInterfaceProps {
  currentStep: number;
  fromAmount: string;
  toAmount: string;
  fromToken: Token | null;
  toToken: Token | null;
  exchangeRate: string | null;
  estimatedGas?: number | null;
  isLoadingPrice?: boolean;
  priceError?: string | null;
  isConnected?: boolean;
  fromTokenBalance?: { formatted: string; symbol: string } | null;
  toTokenBalance?: { formatted: string; symbol: string } | null;
  isExecuting?: boolean;
  executionProgress?: SwapExecutionProgress | null;
  activeTab: string;
  onFromAmountChange: (amount: string) => void;
  onTabChange: (tab: string) => void;
  onSwap: () => void;
  onNextStep: () => void;
  onBackToStep: (step: number) => void;
  onExecuteSwap?: () => void;
}

export const SwapInterface = ({
  currentStep,
  fromAmount,
  toAmount,
  fromToken,
  toToken,
  exchangeRate,
  estimatedGas,
  isLoadingPrice,
  priceError,
  isConnected,
  fromTokenBalance,
  toTokenBalance,
  isExecuting,
  executionProgress,
  activeTab,
  onFromAmountChange,
  onTabChange,
  onSwap,
  onNextStep,
  onBackToStep,
  onExecuteSwap,
}: SwapInterfaceProps) => {
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
            <TokenSelection
              fromAmount={fromAmount}
              toAmount={toAmount}
              fromToken={fromToken}
              toToken={toToken}
              exchangeRate={exchangeRate}
              isLoadingPrice={isLoadingPrice}
              priceError={priceError}
              isConnected={isConnected}
              fromTokenBalance={fromTokenBalance}
              toTokenBalance={toTokenBalance}
              onFromAmountChange={onFromAmountChange}
              onSwap={onSwap}
              onNextStep={onNextStep}
            />
          </>
        );
      case 2:
        // Format gas fee - realistic calculation based on network conditions
        const formatGasFee = (gasUnits: number) => {
          // Typical Ethereum gas parameters
          const avgGasPriceGwei = 25; // 25 gwei average (can be 10-100+ depending on network)
          const ethPriceUSD = 2500; // ~$2500 ETH (adjust based on market)

          // Calculate gas cost in ETH then USD
          const gasCostETH = (gasUnits * avgGasPriceGwei) / 1e9;
          const gasCostUSD = gasCostETH * ethPriceUSD;

          // Ensure minimum of $0.01 and reasonable maximum
          const finalCost = Math.max(0.01, Math.min(gasCostUSD, 100));
          return `$${finalCost.toFixed(2)}`;
        };

        return (
          <ReviewConfirm
            fromAmount={fromAmount}
            toAmount={toAmount}
            fromToken={fromToken}
            toToken={toToken}
            estimatedGas={
              estimatedGas && estimatedGas > 0
                ? formatGasFee(estimatedGas)
                : "$2.50"
            }
            exchangeRate={
              exchangeRate ||
              (fromToken?.symbol && toToken?.symbol
                ? `1 ${fromToken.symbol} = ? ${toToken.symbol}`
                : "")
            }
            onBack={() => onBackToStep(1)}
            onNextStep={onNextStep}
          />
        );
      case 3:
        return (
          <Processing
            progress={executionProgress}
            isExecuting={isExecuting}
            onComplete={onNextStep}
          />
        );
      case 4:
        return (
          <PizzaApproval
            progress={executionProgress}
            onComplete={onNextStep}
            onExecuteSwap={onExecuteSwap}
          />
        );
      case 5:
        return (
          <TransactionComplete
            fromAmount={fromAmount}
            toAmount={toAmount}
            fromToken={fromToken}
            toToken={toToken}
            progress={executionProgress}
            onNewSwap={() => onBackToStep(1)}
            onNextStep={onNextStep}
          />
        );
      case 6:
        return (
          <NFTBadgeReward
            fromAmount={fromAmount}
            toAmount={toAmount}
            fromToken={fromToken}
            toToken={toToken}
            onNewSwap={() => onBackToStep(1)}
          />
        );
      default:
        return (
          <>
            <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
            <TokenSelection
              fromAmount={fromAmount}
              toAmount={toAmount}
              fromToken={fromToken}
              toToken={toToken}
              exchangeRate={exchangeRate}
              isLoadingPrice={isLoadingPrice}
              priceError={priceError}
              isConnected={isConnected}
              fromTokenBalance={fromTokenBalance}
              toTokenBalance={toTokenBalance}
              onFromAmountChange={onFromAmountChange}
              onSwap={onSwap}
              onNextStep={onNextStep}
            />
          </>
        );
    }
  };

  return <div className="w-full max-w-4xl">{renderStepContent()}</div>;
};
