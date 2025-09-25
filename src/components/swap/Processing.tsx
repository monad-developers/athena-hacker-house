import { useState, useEffect } from "react";
import {
  SwapExecutionProgress,
  formatTransactionHash,
} from "@/services/swapExecution";

interface ProcessingProps {
  progress?: SwapExecutionProgress | null;
  isExecuting?: boolean;
  onComplete?: () => void;
}

interface Validator {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  approvalRate: number;
  status: "reviewing" | "approved" | "pending";
  comment: string;
  voteTime: number; // seconds to vote
}

// Fake validator pool - moved outside component to prevent re-creation
const validatorPool: Validator[] = [
  {
    id: "1",
    name: "CryptoGrandma47",
    avatar: "👵",
    bio: "Professional blockchain validator since 2021, loves cats and DeFi",
    approvalRate: 99.2,
    status: "pending",
    comment: "Looks legit to me! 👍",
    voteTime: 2000,
  },
  {
    id: "2",
    name: "DogeCoinMiner2009",
    avatar: "🐕",
    bio: "Much validator, very approve, wow!",
    approvalRate: 97.8,
    status: "pending",
    comment: "Such legitimate transaction, much approve! 🚀",
    voteTime: 1500,
  },
  {
    id: "3",
    name: "ElonMuskFan420",
    avatar: "🚀",
    bio: "To the moon! Professional rocket validator",
    approvalRate: 94.5,
    status: "pending",
    comment: "This transaction is going to Mars! ✅",
    voteTime: 2500,
  },
  {
    id: "4",
    name: "PizzaValidatorPro",
    avatar: "🍕",
    bio: "Validating transactions since 2017, powered by pizza",
    approvalRate: 98.1,
    status: "pending",
    comment: "Approved! This deserves extra cheese 🧀",
    voteTime: 1800,
  },
  {
    id: "5",
    name: "BlockchainBob",
    avatar: "🤓",
    bio: "PhD in Crypto, expert in legitimate transactions",
    approvalRate: 99.7,
    status: "pending",
    comment: "After careful analysis: APPROVED ✅",
    voteTime: 3000,
  },
  {
    id: "6",
    name: "CoffeeChainValidator",
    avatar: "☕",
    bio: "Fueled by caffeine, powered by blockchain",
    approvalRate: 96.3,
    status: "pending",
    comment: "Approved faster than my morning brew! ⚡",
    voteTime: 1200,
  },
];

export const Processing = ({ progress, onComplete }: ProcessingProps) => {
  const [validators, setValidators] = useState<Validator[]>(() => {
    // Initialize with 3 random validators immediately
    const shuffled = [...validatorPool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  });
  const [currentVoter, setCurrentVoter] = useState(0);
  const [votingComplete, setVotingComplete] = useState(false);
  const [showRealStatus, setShowRealStatus] = useState(false);
  const [votingStarted, setVotingStarted] = useState(false);

  // Start voting animation
  useEffect(() => {
    if (validators.length === 0 || votingComplete || votingStarted) return;

    setVotingStarted(true);

    const voteSequentially = async () => {
      for (let i = 0; i < validators.length; i++) {
        setCurrentVoter(i);

        // Update validator to reviewing
        setValidators((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "reviewing" };
          return updated;
        });

        // Wait for this validator's vote time
        await new Promise((resolve) =>
          setTimeout(resolve, validators[i].voteTime)
        );

        // Update validator to approved
        setValidators((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "approved" };
          return updated;
        });

        // Small gap between voters
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setVotingComplete(true);

      // Show real status after fake voting
      setTimeout(() => {
        setShowRealStatus(true);

        // Auto-complete after showing real status for 3 seconds
        setTimeout(() => {
          onComplete?.();
        }, 3000);
      }, 1000);
    };

    voteSequentially();
  }, [validators, votingComplete, votingStarted, onComplete]);

  const getStepIcon = (step: number, currentStep: number) => {
    if (step < currentStep) return "✅";
    if (step === currentStep) return "🔄";
    return "⏳";
  };

  const getStepStatus = (step: number, currentStep: number) => {
    if (step < currentStep) return "Completed";
    if (step === currentStep) return "Processing...";
    return "Pending";
  };

  // Show real blockchain status if available
  if (showRealStatus && progress) {
    return (
      <div className="glass-card rounded-3xl p-8 relative shadow-2xl max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#6E54FF" }}
          >
            <span className="text-3xl">🎯</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Transaction Processing
          </h2>
          <p className="text-white/70 text-lg">Real blockchain status</p>
        </div>

        <div className="space-y-4">
          <div className="glass-dark rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70">Status</span>
              <span className="text-pastel-mint font-semibold">
                {progress.step === "complete" ? "Complete" : progress.message}
              </span>
            </div>

            {progress.transactionHash && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/70">Transaction Hash</span>
                <code className="text-pastel-mint text-sm font-mono">
                  {formatTransactionHash(progress.transactionHash)}
                </code>
              </div>
            )}

            {progress.transactionHash && (
              <div className="text-center">
                <a
                  href={`https://etherscan.io/tx/${progress.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105"
                  style={{ backgroundColor: "#6E54FF" }}
                >
                  <span>View on Explorer</span>
                  <span>↗️</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show fake community validation UI
  return (
    <div className="glass-card rounded-3xl p-8 relative shadow-2xl max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#6E54FF" }}
        >
          <span className="text-3xl">🏛️</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          🗳️ Community Validation
        </h2>
        <p className="text-white/70 text-lg">
          Our network of 2,847 validators are reviewing your transaction...
        </p>
        {!votingStarted && (
          <p className="text-pastel-yellow text-sm mt-2">
            Collecting consensus...
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Progress Steps */}
        <div className="flex-1">
          <div className="glass-dark rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              📋 Validation Progress
            </h3>
            <div className="space-y-3">
              {[
                "Transaction Received",
                "Security Validation",
                "Liquidity Check",
                "Network Verification",
                "Final Approval",
              ].map((step, index) => {
                const currentStep = votingComplete
                  ? 5
                  : votingStarted
                  ? Math.min(currentVoter + 2, 4)
                  : 0;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                      index < currentStep
                        ? "bg-pastel-mint/20 border border-pastel-mint/30"
                        : index === currentStep
                        ? "bg-pastel-yellow/20 border border-pastel-yellow/30"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor:
                          index < currentStep
                            ? "#10B981"
                            : index === currentStep
                            ? "#F59E0B"
                            : "#6E54FF",
                      }}
                    >
                      <span className="text-lg text-white">
                        {getStepIcon(index, currentStep)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{step}</div>
                      <div className="text-white/60 text-sm">
                        {getStepStatus(index, currentStep)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Validators */}
        <div className="flex-1">
          <div className="glass-dark rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              👥 Active Validators
            </h3>

            <div className="space-y-4">
              {validators.map((validator, index) => (
                <div
                  key={validator.id}
                  className={`p-4 rounded-2xl transition-all duration-500 ${
                    validator.status === "reviewing" && index === currentVoter
                      ? "bg-pastel-yellow/20 border-2 border-pastel-yellow/50 scale-105"
                      : validator.status === "approved"
                      ? "bg-pastel-mint/20 border border-pastel-mint/30"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: "#6E54FF" }}
                      >
                        {validator.avatar}
                      </div>
                      {validator.status === "approved" && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-pastel-mint rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      {validator.status === "reviewing" &&
                        index === currentVoter && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-pastel-yellow rounded-full flex items-center justify-center animate-spin">
                            <span className="text-white text-xs">⚡</span>
                          </div>
                        )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-white">
                          {validator.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-pastel-mint text-sm">
                            {validator.approvalRate}% ✅
                          </span>
                        </div>
                      </div>

                      <p className="text-white/70 text-sm mb-2">
                        {validator.bio}
                      </p>

                      {validator.status === "approved" && (
                        <div className="glass-dark rounded-lg p-2">
                          <p className="text-pastel-mint text-sm font-medium">
                            &quot;{validator.comment}&quot;
                          </p>
                        </div>
                      )}

                      {validator.status === "reviewing" &&
                        index === currentVoter && (
                          <div className="bg-pastel-yellow/10 rounded-lg p-2">
                            <p className="text-pastel-yellow text-sm">
                              Reviewing transaction details...
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {votingComplete && !showRealStatus && (
        <div className="text-center py-6">
          <div className="mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h3 className="text-xl font-bold text-pastel-mint mb-2">
            Community Approved!
          </h3>
          <p className="text-white/70 mb-4">
            Your transaction has been validated by the community
          </p>
          <div className="text-sm text-white/60">
            Proceeding to blockchain execution...
          </div>
        </div>
      )}

      {/* Bottom feedback messages */}
      {votingStarted && !votingComplete && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="glass-dark rounded-full px-6 py-2">
            <p className="text-pastel-yellow text-sm flex items-center">
              <span className="mr-2">🏛️</span>
              Validators are deliberating...
              <span className="ml-2">⚖️</span>
            </p>
          </div>
        </div>
      )}

      {votingComplete && !showRealStatus && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="glass-dark rounded-full px-6 py-2 border border-green-500/30">
            <p className="text-pastel-mint text-sm flex items-center">
              <span className="mr-2">✅</span>
              Consensus reached! Moving to blockchain...
              <span className="ml-2 animate-spin">🚀</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
