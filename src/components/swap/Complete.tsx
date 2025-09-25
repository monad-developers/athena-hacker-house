interface CompleteProps {
  fromAmount: string;
  toAmount: string;
  onNewSwap: () => void;
}

export const Complete = ({
  fromAmount,
  toAmount,
  onNewSwap,
}: CompleteProps) => {
  return (
    <div className="glass-card rounded-3xl p-6 relative shadow-2xl text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-pastel-mint rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Swap Complete!</h2>
        <p className="text-white/70">
          Your tokens have been successfully swapped
        </p>
      </div>

      <div className="glass-dark rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70">You Sent:</span>
          <span className="text-white">{fromAmount} BNB</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70">You Received:</span>
          <span className="text-white">{toAmount} USDT</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70">Transaction Hash:</span>
          <span className="text-white text-sm font-mono">0x1234...abcd</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/70">Block Number:</span>
          <span className="text-white">18,234,567</span>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onNewSwap}
          className="flex-1 text-white font-semibold py-4 px-6 rounded-2xl border border-white/20 hover:bg-white/10 transition-colors"
        >
          New Swap
        </button>
        <button
          className="flex-1 text-white font-semibold py-4 px-6 rounded-2xl transition-colors hover:opacity-90"
          style={{ backgroundColor: "#6E54FF" }}
        >
          View on Explorer
        </button>
      </div>
    </div>
  );
};
