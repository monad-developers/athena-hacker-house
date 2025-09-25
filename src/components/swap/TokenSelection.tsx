import { Token } from "@/types/swap";

interface TokenSelectionProps {
  fromAmount: string;
  toAmount: string;
  fromToken: Token | null;
  toToken: Token | null;
  exchangeRate: string | null;
  isLoadingPrice?: boolean;
  priceError?: string | null;
  isConnected?: boolean;
  fromTokenBalance?: { formatted: string; symbol: string } | null;
  toTokenBalance?: { formatted: string; symbol: string } | null;
  onFromAmountChange: (amount: string) => void;
  onSwap: () => void;
  onNextStep: () => void;
}

export const TokenSelection = ({
  fromAmount,
  toAmount,
  fromToken,
  toToken,
  exchangeRate,
  isLoadingPrice = false,
  priceError,
  isConnected = false,
  fromTokenBalance,
  toTokenBalance,
  onFromAmountChange,
  onSwap,
  onNextStep,
}: TokenSelectionProps) => {
  return (
    <div className="glass-card rounded-3xl p-6 relative shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Select Your Tokens
        </h2>
        <p className="text-white/70">Choose the tokens you want to swap</p>
      </div>

      {/* Settings and Refresh Icons */}
      <div className="flex justify-end mb-4 space-x-2">
        <button className="glass-button w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full text-white transition-all">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <button className="glass-button w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full text-white transition-all">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* From and To Sections Side by Side */}
      <div className="flex gap-6 items-center">
        {/* From Section */}
        <div className="glass-dark rounded-2xl p-6 flex-1 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/70 text-sm">From:</span>
            <span className="text-white/70 text-sm">2er6d...8dfg2 N</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-white/70 text-sm">Token</span>
            <span className="text-white/70 text-sm">Network</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  fromToken?.backgroundColor || "bg-gray-500"
                }`}
              >
                <span className="text-xs font-bold text-white">
                  {fromToken?.icon || fromToken?.symbol?.[0] || "?"}
                </span>
              </div>
              <span className="text-white font-medium">
                {fromToken?.symbol || "Select Token"}
              </span>
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">⟠</span>
              </div>
              <span className="text-white font-medium">Ethereum</span>
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl p-4 ">
            <div className="flex justify-between items-start mb-6 ">
              <span className="text-white/70 text-sm">You send:</span>
              <div className="text-right">
                <span className="text-white/70 text-sm">
                  {isConnected && fromTokenBalance
                    ? `Available: ${parseFloat(
                        fromTokenBalance.formatted
                      ).toFixed(4)} ${fromTokenBalance.symbol}`
                    : "Available: --"}
                </span>
                {isConnected && fromTokenBalance && (
                  <button
                    onClick={() =>
                      onFromAmountChange(fromTokenBalance.formatted)
                    }
                    className="text-white px-3 py-1 text-xs font-bold rounded inline-block ml-2 hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "#6E54FF" }}
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-end">
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => onFromAmountChange(e.target.value)}
                className="text-white text-4xl font-light bg-transparent border-none outline-none w-full"
                placeholder="0.00"
              />
              <div className="text-white/50 text-sm">
                {fromAmount && fromToken
                  ? `≈$${(
                      parseFloat(fromAmount.replace(/,/g, "")) * 1000
                    ).toLocaleString()}`
                  : "≈$0"}
              </div>
            </div>
          </div>
        </div>

        {/* Swap Button Container */}
        <div className="flex justify-center items-center px-4">
          <button
            onClick={onSwap}
            className="glass-button w-14 h-14 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>
        </div>

        {/* To Section */}
        <div className="glass-dark rounded-2xl p-6 flex-1 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/70 text-sm">To:</span>
            <span className="text-white/70 text-sm">0xe5d...85bde 🦊</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-white/70 text-sm">Token</span>
            <span className="text-white/70 text-sm">Network</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  toToken?.backgroundColor || "bg-gray-500"
                }`}
              >
                <span className="text-xs font-bold text-white">
                  {toToken?.icon || toToken?.symbol?.[0] || "?"}
                </span>
              </div>
              <span className="text-white font-medium">
                {toToken?.symbol || "Select Token"}
              </span>
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">⟠</span>
              </div>
              <span className="text-white font-medium">Ethereum</span>
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          <div className="bg-black/20 rounded-2xl p-4 ">
            <div className="flex justify-between items-start mb-6">
              <span className="text-white/70 text-sm">You receive:</span>
              <div className="text-right">
                <span className="text-white/70 text-sm">
                  {isConnected && toTokenBalance
                    ? `Balance: ${parseFloat(toTokenBalance.formatted).toFixed(
                        4
                      )} ${toTokenBalance.symbol}`
                    : "Balance: --"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-white text-4xl font-light">
                {isLoadingPrice ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="text-lg">Loading...</span>
                  </div>
                ) : priceError ? (
                  <span className="text-red-400 text-lg">Error</span>
                ) : (
                  toAmount || "0.00"
                )}
              </div>
              <div className="text-white/50 text-sm">
                {toAmount && toToken
                  ? `≈$${(
                      parseFloat(toAmount.replace(/,/g, "")) * 1000
                    ).toLocaleString()}`
                  : "≈$0"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span className="text-white/70">
          {exchangeRate ||
            (fromToken && toToken
              ? `1 ${fromToken.symbol} = -- ${toToken.symbol}`
              : "Select tokens to see rate")}
        </span>
        {exchangeRate && <span className="text-pastel-blue">Live Rate</span>}
      </div>
      <div className="text-white/50 text-xs mt-1">
        {priceError ? (
          <span className="text-red-400">{priceError}</span>
        ) : (
          "Rate is for reference only. Updated in real-time"
        )}
      </div>

      {/* Continue Button */}
      <button
        onClick={onNextStep}
        disabled={
          !fromToken ||
          !toToken ||
          !fromAmount ||
          isLoadingPrice ||
          !!priceError
        }
        className="w-full text-white font-semibold py-4 px-6 rounded-2xl mt-6 transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#6E54FF" }}
      >
        {isLoadingPrice ? "Getting Price..." : "Review Swap ››"}
      </button>
    </div>
  );
};
