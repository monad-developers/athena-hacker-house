import { useState, useEffect, useCallback, useRef } from "react";
import { SwapExecutionProgress } from "@/services/swapExecution";
import {
  formatTransactionHash,
  getTransactionUrl,
} from "@/services/swapExecution";
import { useChainId } from "wagmi";

interface TransactionCompleteProps {
  fromAmount: string;
  toAmount: string;
  fromToken: { symbol: string } | null;
  toToken: { symbol: string } | null;
  progress?: SwapExecutionProgress | null;
  onNewSwap: () => void;
  onNextStep?: () => void;
}

interface Celebration {
  id: number;
  icon: "star" | "sparkle" | "circle" | "diamond";
  x: number;
  y: number;
  delay: number;
  duration: number;
}

const celebrationMessages = [
  "TRANSACTION SUCCESSFUL!",
  "You've survived the over-engineered swap!",
  "All theatrical delays were worth it!",
  "Your tokens have been successfully swapped!",
];

// SVG Icon Components
const CelebrationIcon = ({
  type,
  className = "",
}: {
  type: "star" | "sparkle" | "circle" | "diamond";
  className?: string;
}) => {
  switch (type) {
    case "star":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l2.4 7.4h7.6l-6 4.6 2.4 7.4-6-4.6-6 4.6 2.4-7.4-6-4.6h7.6L12 2z"
            fill="currentColor"
            opacity="0.6"
          />
        </svg>
      );
    case "sparkle":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 0l1 5h5l-4 3 1.5 4.5L12 10l-3.5 2.5L10 8l-4-3h5l1-5z"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      );
    case "circle":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case "diamond":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 2l6 6-6 6-6-6 6-6z" fill="currentColor" opacity="0.6" />
        </svg>
      );
    default:
      return null;
  }
};

const TrophyIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M7 8h10v8a4 4 0 01-4 4h-2a4 4 0 01-4-4V8z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M7 12H4a2 2 0 01-2-2V8a2 2 0 012-2h3M17 12h3a2 2 0 002-2V8a2 2 0 00-2-2h-3"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const CheckIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M9 12l2 2 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const ChartIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 3v18h18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M7 16l4-4 4 4 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RefreshIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 4v5h.581m15.356-2A8.001 8.001 0 004.581 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357 2m15.357-2H15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GiftIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="8"
      width="18"
      height="4"
      rx="1"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect
      x="4"
      y="12"
      width="16"
      height="9"
      rx="1"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M12 8V4a2 2 0 00-2-2 2 2 0 00-2 2v4M12 8a2 2 0 012-2 2 2 0 012 2v4"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const ExternalIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MedalIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
    <path
      d="M8.21 13.89L7 14.01V21l5-3 5 3v-6.99l-1.21-.12"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export const TransactionComplete = ({
  fromAmount,
  toAmount,
  fromToken,
  toToken,
  progress,
  onNewSwap,
  onNextStep,
}: TransactionCompleteProps) => {
  const chainId = useChainId();
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const celebrationStartedRef = useRef(false);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random celebration icons - memoized to prevent re-creation
  const generateCelebrations = useCallback(() => {
    const celebrationIcons: ("star" | "sparkle" | "circle" | "diamond")[] = [
      "star",
      "sparkle",
      "circle",
      "diamond",
    ];
    const newCelebrations: Celebration[] = [];

    for (let i = 0; i < 20; i++) {
      newCelebrations.push({
        id: i,
        icon: celebrationIcons[
          Math.floor(Math.random() * celebrationIcons.length)
        ],
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2000,
        duration: 2000 + Math.random() * 3000,
      });
    }

    return newCelebrations;
  }, []);

  useEffect(() => {
    if (!celebrationStartedRef.current) {
      setCelebrations(generateCelebrations());
    }
  }, [generateCelebrations]);

  // Memoized celebration sequence to prevent re-execution
  const startCelebration = useCallback(async () => {
    if (celebrationStartedRef.current) return;
    celebrationStartedRef.current = true;

    setShowCelebration(true);

    // Cycle through messages
    for (let i = 0; i < celebrationMessages.length; i++) {
      setCurrentMessage(i);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Show detailed stats
    setTimeout(() => {
      setShowStats(true);
    }, 1000);

    // Auto advance to final step after celebration
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      onNextStep?.();
    }, 8000); // 8 seconds total celebration time
  }, [onNextStep]);

  // Start celebration sequence
  useEffect(() => {
    if (!celebrationStartedRef.current) {
      startCelebration();
    }
  }, [startCelebration]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Manual navigation handler that prevents double-execution
  const handleNextStepClick = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    onNextStep?.();
  }, [onNextStep]);

  const handleNewSwapClick = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    // Reset the celebration state for potential next use
    celebrationStartedRef.current = false;
    onNewSwap();
  }, [onNewSwap]);

  return (
    <div className="glass-card rounded-3xl p-8 relative shadow-2xl max-w-4xl mx-auto overflow-hidden">
      {/* Floating celebration icons */}
      {showCelebration &&
        celebrations.map((celebration) => (
          <div
            key={celebration.id}
            className="absolute pointer-events-none w-6 h-6 text-purple-200/30"
            style={{
              left: `${celebration.x}%`,
              top: `${celebration.y}%`,
              animationDelay: `${celebration.delay}ms`,
              animationDuration: `${celebration.duration}ms`,
            }}
          >
            <CelebrationIcon
              type={celebration.icon}
              className="w-full h-full"
            />
          </div>
        ))}

      {/* Main celebration header */}
      <div className="text-center mb-8 relative z-10">
        <div className="mb-6 flex justify-center">
          <TrophyIcon className="w-20 h-20 text-yellow-300/70" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">
          {celebrationMessages[currentMessage]}
        </h2>
        <p className="text-white/70 text-lg">
          Congratulations! You&apos;ve completed Elton&apos;s Over-Engineered
          Swap Protocol
        </p>
        <div className="mt-4">
          <div className="inline-flex items-center space-x-2 px-6 py-3 glass-dark rounded-full">
            <div className="w-3 h-3 rounded-full bg-green-300/60"></div>
            <span className="text-green-300/90 font-semibold">
              SWAP COMPLETED SUCCESSFULLY
            </span>
          </div>
        </div>
      </div>

      {/* Success Animation */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full glass-dark border border-green-300/20 flex items-center justify-center">
            <CheckIcon className="w-16 h-16 text-green-300/80" />
          </div>
          <div className="absolute -top-4 -right-4">
            <div className="w-8 h-8 rounded-full glass-dark border border-purple-300/20 flex items-center justify-center">
              <CelebrationIcon
                type="sparkle"
                className="w-4 h-4 text-purple-300/60"
              />
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4">
            <div className="w-6 h-6 rounded-full glass-dark border border-blue-300/20 flex items-center justify-center">
              <CelebrationIcon
                type="star"
                className="w-3 h-3 text-blue-300/60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Swap Summary */}
      <div className="glass-dark rounded-2xl p-6 mb-8">
        <h3 className="text-white font-semibold mb-4 text-center flex items-center justify-center">
          <ChartIcon className="w-5 h-5 mr-2 text-blue-300/70" />
          Swap Summary
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white/70">You Sent:</span>
            <div className="text-white font-bold flex items-center">
              <span>{fromAmount}</span>
              <span className="ml-2 text-blue-300/90">{fromToken?.symbol}</span>
            </div>
          </div>
          <div className="w-full h-px bg-white/10"></div>
          <div className="flex items-center justify-between">
            <span className="text-white/70">You Received:</span>
            <div className="text-white font-bold flex items-center">
              <span>{toAmount}</span>
              <span className="ml-2 text-green-300/90">{toToken?.symbol}</span>
            </div>
          </div>

          {progress && (
            <>
              <div className="w-full h-px bg-white/10"></div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Transaction Hash:</span>
                {progress.transactionHash ? (
                  <a
                    href={getTransactionUrl(progress.transactionHash, chainId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300/80 hover:text-blue-200 text-sm font-mono transition-colors"
                  >
                    {formatTransactionHash(progress.transactionHash)}
                  </a>
                ) : (
                  <span className="text-white/50 text-sm">Processing...</span>
                )}
              </div>
            </>
          )}

          <div className="w-full h-px bg-white/10"></div>
          <div className="flex items-center justify-between">
            <span className="text-white/70">Status:</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-300/70"></div>
              <span className="text-green-300/90 font-semibold">Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comedy Stats */}
      {showStats && (
        <div className="glass-dark rounded-2xl p-6 mb-8 animate-fadeIn">
          <h3 className="text-white font-semibold mb-4 text-center">
            Over-Engineering Statistics
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300/80 mb-1">
                4
              </div>
              <div className="text-white/70 text-sm">
                Theatrical Steps Completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-300/80 mb-1">
                100%
              </div>
              <div className="text-white/70 text-sm">
                Comedy Mission Success
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300/80 mb-1">
                ∞
              </div>
              <div className="text-white/70 text-sm">
                Unnecessary Complexity
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-300/80 mb-1">
                1
              </div>
              <div className="text-white/70 text-sm">
                Pizza Consumed by Elton
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-300/20">
            <p className="text-center text-white text-sm italic">
              &ldquo;Congratulations! You&apos;ve successfully navigated the
              most unnecessarily complex token swap in DeFi history. Your
              patience with our theatrical delays has been rewarded!&rdquo; -
              Elton
            </p>
          </div>
        </div>
      )}

      {/* Achievement Unlocked */}
      {showStats && (
        <div className="glass-dark rounded-2xl p-6 mb-8 animate-fadeIn border-2 border-yellow-300/20">
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <MedalIcon className="w-16 h-16 text-yellow-300/70" />
            </div>
            <h3 className="text-yellow-300/90 font-bold text-xl mb-2">
              ACHIEVEMENT UNLOCKED!
            </h3>
            <p className="text-white font-semibold mb-2">
              &ldquo;Swap Survivor&rdquo;
            </p>
            <p className="text-white/70 text-sm">
              You survived Elton&apos;s Over-Engineered Swap Protocol and lived
              to tell the tale!
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleNewSwapClick}
          className="flex-1 text-white font-semibold py-4 px-6 rounded-2xl border border-white/20 hover:bg-white/10 transition-all duration-300 hover:scale-105 flex items-center justify-center"
        >
          <RefreshIcon className="w-5 h-5 mr-2" />
          Try Another Swap Adventure
        </button>
        <button
          onClick={handleNextStepClick}
          className="flex-1 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center"
          style={{ backgroundColor: "#6E54FF" }}
        >
          <GiftIcon className="w-5 h-5 mr-2" />
          Claim NFT Badge →
        </button>
        {progress?.transactionHash && (
          <button
            onClick={() =>
              window.open(
                getTransactionUrl(progress.transactionHash!, chainId),
                "_blank"
              )
            }
            className="flex-1 text-white font-semibold py-4 px-6 rounded-2xl border border-pastel-mint/30 bg-pastel-mint/20 hover:bg-pastel-mint/30 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          >
            <ExternalIcon className="w-5 h-5 mr-2" />
            View on Explorer
          </button>
        )}
      </div>

      {/* Bottom encouragement */}
      <div className="text-center mt-6">
        <p className="text-white/50 text-sm">
          {showStats
            ? "Ready for your NFT badge? Click above to proceed to the final step!"
            : "Celebrating your successful swap..."}
        </p>
      </div>
    </div>
  );
};
