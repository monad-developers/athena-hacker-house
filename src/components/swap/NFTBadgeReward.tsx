import { useState, useEffect } from "react";

interface NFTBadgeRewardProps {
  fromAmount: string;
  toAmount: string;
  fromToken: { symbol: string } | null;
  toToken: { symbol: string } | null;
  onNewSwap: () => void;
}

interface BadgeAttribute {
  trait_type: string;
  value: string | number;
}

interface FloatingElement {
  id: number;
  emoji: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

const badgeAttributes: BadgeAttribute[] = [
  { trait_type: "Survival Status", value: "Legendary Survivor" },
  { trait_type: "Comedy Tolerance", value: "Maximum" },
  { trait_type: "Pizza Approval", value: "Witnessed" },
  { trait_type: "Gas Roulette", value: "Spun" },
  { trait_type: "Community Validation", value: "Approved" },
  { trait_type: "Over-Engineering Level", value: "∞" },
  { trait_type: "Elton's Rating", value: "5 Stars" },
  { trait_type: "Completion Date", value: new Date().toLocaleDateString() },
];

export const NFTBadgeReward = ({
  fromAmount,
  toAmount,
  fromToken,
  toToken,
  onNewSwap,
}: NFTBadgeRewardProps) => {
  const [mintingStage, setMintingStage] = useState<
    "preparation" | "minting" | "complete"
  >("preparation");
  const [currentAttribute, setCurrentAttribute] = useState(0);
  const [showNFTPreview, setShowNFTPreview] = useState(false);
  const [badgeGenerated, setBadgeGenerated] = useState(false);
  const [floatingElements, setFloatingElements] = useState<FloatingElement[]>(
    []
  );

  // Generate floating celebration elements
  useEffect(() => {
    const celebrationEmojis = [
      "🏆",
      "🎖️",
      "🥇",
      "⭐",
      "✨",
      "🌟",
      "💎",
      "👑",
      "🎊",
      "🎉",
    ];
    const elements: FloatingElement[] = [];

    for (let i = 0; i < 15; i++) {
      elements.push({
        id: i,
        emoji:
          celebrationEmojis[
            Math.floor(Math.random() * celebrationEmojis.length)
          ],
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3000,
        duration: 3000 + Math.random() * 2000,
      });
    }

    setFloatingElements(elements);
  }, []);

  // NFT minting sequence
  useEffect(() => {
    const mintSequence = async () => {
      // Stage 1: Preparation (2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setMintingStage("minting");

      // Stage 2: Minting with attribute reveal (5 seconds)
      for (let i = 0; i < badgeAttributes.length; i++) {
        setCurrentAttribute(i);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowNFTPreview(true);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMintingStage("complete");
      setBadgeGenerated(true);
    };

    mintSequence();
  }, []);

  const renderBadgeDesign = () => (
    <div className="relative w-80 h-80 mx-auto">
      {/* Badge Background */}
      <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 shadow-2xl border-8 border-white/20 relative overflow-hidden">
        {/* Inner Ring */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-4 border-white/10 shadow-inner">
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-2">🏆</div>
            <div className="text-white font-bold text-lg mb-1">
              SWAP SURVIVOR
            </div>
            <div className="text-pastel-yellow text-sm">
              {new Date().getFullYear()}
            </div>

            {/* Decorative Stars */}
            <div className="absolute top-6 left-6 text-pastel-yellow text-xl animate-spin-slow">
              ⭐
            </div>
            <div
              className="absolute top-6 right-6 text-pastel-yellow text-xl animate-spin-slow"
              style={{ animationDelay: "1s" }}
            >
              ⭐
            </div>
            <div
              className="absolute bottom-6 left-6 text-pastel-yellow text-xl animate-spin-slow"
              style={{ animationDelay: "2s" }}
            >
              ⭐
            </div>
            <div
              className="absolute bottom-6 right-6 text-pastel-yellow text-xl animate-spin-slow"
              style={{ animationDelay: "3s" }}
            >
              ⭐
            </div>
          </div>
        </div>

        {/* Achievement Ribbon */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#6E54FF] text-white px-4 py-1 text-xs font-bold rounded-full border-2 border-white/20">
          LEGENDARY
        </div>
      </div>

      {/* Glowing Effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6E54FF]/40 to-blue-500/40 opacity-30 blur-sm"></div>
    </div>
  );

  return (
    <div className="glass-card rounded-3xl p-8 relative shadow-2xl max-w-4xl mx-auto overflow-hidden min-h-[600px]">
      {/* Floating celebration elements */}
      {badgeGenerated &&
        floatingElements.map((element) => (
          <div
            key={element.id}
            className="absolute pointer-events-none text-3xl opacity-80"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              animationDelay: `${element.delay}ms`,
              animationDuration: `${element.duration}ms`,
            }}
          >
            {element.emoji}
          </div>
        ))}

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="text-8xl mb-4">🏆</div>
        <h2 className="text-4xl font-bold text-white mb-4">
          {mintingStage === "preparation" && "🎨 Preparing Your NFT Badge..."}
          {mintingStage === "minting" && "⚡ Minting Your Achievement..."}
          {mintingStage === "complete" && "🎉 NFT Badge Minted Successfully!"}
        </h2>
        <p className="text-white/70 text-lg">
          {mintingStage === "complete"
            ? "Congratulations! You now own a legendary 'I Survived The Swap' NFT badge!"
            : "Creating your unique survival certificate..."}
        </p>
      </div>

      {/* Minting Progress */}
      {mintingStage !== "complete" && (
        <div className="mb-8">
          <div className="glass-dark rounded-2xl p-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center space-x-2 px-4 py-2 glass-steps rounded-full">
                <div className="w-3 h-3 rounded-full bg-[#6E54FF]"></div>
                <span className="text-white font-semibold">
                  {mintingStage === "preparation"
                    ? "Preparing NFT..."
                    : "Minting in Progress..."}
                </span>
              </div>
            </div>

            {/* Progress Animation */}
            <div className="w-full bg-white/10 rounded-full h-4 mb-4">
              <div
                className="h-4 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-[#6E54FF] to-blue-400"
                style={{
                  width:
                    mintingStage === "preparation"
                      ? "20%"
                      : `${
                          20 + (currentAttribute / badgeAttributes.length) * 80
                        }%`,
                }}
              />
            </div>

            {/* Current Attribute Being Added */}
            {mintingStage === "minting" && (
              <div className="text-center">
                <p className="text-white/70 text-sm mb-2">Adding attribute:</p>
                <div className="text-white font-semibold">
                  {badgeAttributes[currentAttribute]?.trait_type}:{" "}
                  {badgeAttributes[currentAttribute]?.value}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NFT Badge Preview */}
      {showNFTPreview && (
        <div className="mb-8 animate-fadeIn">{renderBadgeDesign()}</div>
      )}

      {/* NFT Details */}
      {badgeGenerated && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fadeIn">
          {/* NFT Metadata */}
          <div className="glass-dark rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <span className="mr-2">📋</span>
              NFT Metadata
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Name:</span>
                <span className="text-white font-mono">
                  &ldquo;I Survived The Swap&rdquo;
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Collection:</span>
                <span className="text-white">
                  Elton&apos;s Over-Engineered Survivors
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Token Standard:</span>
                <span className="text-white">ERC-721</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Rarity:</span>
                <span className="text-pastel-yellow font-bold">LEGENDARY</span>
              </div>
            </div>
          </div>

          {/* Swap Summary */}
          <div className="glass-dark rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Your Epic Journey
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Swapped:</span>
                <span className="text-white">
                  {fromAmount} {fromToken?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Received:</span>
                <span className="text-white">
                  {toAmount} {toToken?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Steps Survived:</span>
                <span className="text-green-400 font-bold">6/6 ✅</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Comedy Level:</span>
                <span className="text-purple-400">Maximum 🎭</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge Attributes */}
      {badgeGenerated && (
        <div className="glass-dark rounded-2xl p-6 mb-8 animate-fadeIn">
          <h3 className="text-white font-semibold mb-4 text-center">
            🏅 Badge Attributes
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {badgeAttributes.map((attr, index) => (
              <div
                key={index}
                className="text-center p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="text-white/70 text-xs mb-1">
                  {attr.trait_type}
                </div>
                <div className="text-white font-semibold text-sm">
                  {attr.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hall of Fame */}
      {badgeGenerated && (
        <div className="glass-dark rounded-2xl p-6 mb-8 animate-fadeIn">
          <h3 className="text-white font-semibold mb-4 text-center">
            🌟 Welcome to the Hall of Fame
          </h3>
          <div className="text-center">
            <p className="text-white/80 mb-4">
              You are now officially a member of the exclusive &ldquo;Swap
              Survivors&rdquo; club!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-[#6E54FF]/20 to-blue-500/10 rounded-lg border border-[#6E54FF]/30">
                <div className="text-3xl mb-2">🥇</div>
                <div className="text-white font-bold">Gold Tier</div>
                <div className="text-white/70 text-xs">Legendary Survivor</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
                <div className="text-3xl mb-2">🎭</div>
                <div className="text-purple-300 font-bold">Comedy Master</div>
                <div className="text-white/70 text-xs">
                  Survived All Theatrics
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-green-600/10 rounded-lg border border-emerald-500/30">
                <div className="text-3xl mb-2">🚀</div>
                <div className="text-emerald-300 font-bold">DeFi Explorer</div>
                <div className="text-white/70 text-xs">
                  Completed The Journey
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {badgeGenerated && (
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onNewSwap}
            className="flex-1 text-white font-semibold py-4 px-6 rounded-2xl border border-white/20 hover:bg-white/10 transition-all duration-300 hover:scale-105"
          >
            🔄 Start New Swap Adventure
          </button>
          <button
            onClick={() => {
              // Simulate downloading NFT
              const link = document.createElement("a");
              link.href =
                "data:application/json;charset=utf-8," +
                encodeURIComponent(
                  JSON.stringify(
                    {
                      name: "I Survived The Swap",
                      description:
                        "A legendary NFT badge awarded to brave souls who completed Elton's Over-Engineered Swap Protocol",
                      image: "https://example.com/nft-badge.png",
                      attributes: badgeAttributes,
                    },
                    null,
                    2
                  )
                );
              link.download = "swap-survivor-nft.json";
              link.click();
            }}
            className="flex-1 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-purple-500 to-blue-500"
          >
            💾 Download NFT Metadata
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "I Survived The Swap!",
                  text: "I just completed the most over-engineered token swap in DeFi history and earned this legendary NFT badge! 🏆",
                  url: window.location.href,
                });
              }
            }}
            className="flex-1 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: "#6E54FF" }}
          >
            📱 Share Achievement
          </button>
        </div>
      )}

      {/* Final Message */}
      {badgeGenerated && (
        <div className="text-center mt-8 animate-fadeIn">
          <div className="glass-dark rounded-2xl p-6 border-2 border-gold/30">
            <div className="text-4xl mb-3">🎊</div>
            <p className="text-white italic text-lg mb-2">
              &ldquo;Thank you for surviving my over-engineered masterpiece! You
              are now forever part of DeFi comedy history.&rdquo;
            </p>
            <p className="text-white/60 text-sm">
              - Chef Elton, Creator of Theatrical Swaps
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
