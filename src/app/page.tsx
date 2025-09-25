"use client";

import { useSwap } from "@/hooks/useSwap";
import { ProgressSteps, SwapInterface } from "@/components/swap";
import { Header } from "@/components/layout/Header";
import { useApproveGmon, useGmonAllowance } from "@/hooks/useGMON";
import { SIMPLE_SWAP_POOL_ADDRESS, useSwapEthForGmon, useSwapGmonForEth } from "@/hooks/useSimpleSwapPool";
import { Hex, parseEther } from "viem";
import { useChainId, useSwitchChain } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config as wagmiConfig } from "@/lib/wagmi";

export default function Home() {
  const {
    fromAmount,
    setFromAmount,
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
    setActiveTab,
    currentStep,
    setCurrentStep,
    steps,
    handleStepClick,
    handleNextStep,
    handleSwap,
    executeSwap,
  } = useSwap();

  // Local pool hooks (MON <-> GMON)
  const { swap: swapEthForGmon } = useSwapEthForGmon();
  const { swap: swapGmonForEth } = useSwapGmonForEth();
  const { approve: approveGmon } = useApproveGmon();
  const allowanceQuery = useGmonAllowance(undefined, SIMPLE_SWAP_POOL_ADDRESS);
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const executeOnchainSwap = async () => {
    try {
      // Ensure we're on Monad Testnet
      if (chainId !== 10143) {
        await switchChain({ chainId: 10143 });
      }

      const amountStr = fromAmount?.replace(/,/g, "");
      if (!amountStr || Number(amountStr) <= 0 || !fromToken) return;
      const amountWei = parseEther(amountStr);
      const nativeAddr = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
      const isNativeFrom = fromToken.address?.toLowerCase() === nativeAddr;
      const isGmonFrom = (fromToken.symbol || "").toUpperCase() === "GMON";

      if (isNativeFrom) {
        const txHash = (await swapEthForGmon(BigInt(0), amountWei)) as unknown as Hex | undefined;
        if (txHash) {
          await waitForTransactionReceipt(wagmiConfig, { hash: txHash });
        }
      } else if (isGmonFrom) {
        const current = (allowanceQuery.data as bigint | undefined) || BigInt(0);
        if (current < amountWei) {
          const approveHash = (await approveGmon(
            SIMPLE_SWAP_POOL_ADDRESS,
            amountWei
          )) as unknown as Hex | undefined;
          if (approveHash) {
            await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
          }
        }
        const swapHash = (await swapGmonForEth(amountWei, BigInt(0))) as unknown as Hex | undefined;
        if (swapHash) {
          await waitForTransactionReceipt(wagmiConfig, { hash: swapHash });
        }
      } else {
        console.warn("Unsupported pair for local pool. Use MON <-> GMON.");
      }
    } catch (e) {
      console.error("On-chain swap failed", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <ProgressSteps
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Main Swap Interface */}
        <SwapInterface
          currentStep={currentStep}
          fromAmount={fromAmount}
          toAmount={toAmount}
          fromToken={fromToken}
          toToken={toToken}
          exchangeRate={exchangeRate}
          estimatedGas={estimatedGas}
          isLoadingPrice={isLoadingPrice}
          priceError={priceError}
          isConnected={isConnected}
          fromTokenBalance={fromTokenBalance}
          toTokenBalance={toTokenBalance}
          isExecuting={isExecuting}
          executionProgress={executionProgress}
          activeTab={activeTab}
          onFromAmountChange={setFromAmount}
          onTabChange={setActiveTab}
          onSwap={handleSwap}
          onNextStep={handleNextStep}
          onBackToStep={setCurrentStep}
          onExecuteSwap={executeOnchainSwap}
        />
      </main>
    </div>
  );
}
