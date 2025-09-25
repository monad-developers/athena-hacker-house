import { useState, useRef, useEffect } from "react";
import { usePoolReserves } from "@/hooks/useSimpleSwapPool";
import { Token } from "@/types/swap";

interface ReviewConfirmProps {
  fromAmount: string;
  toAmount: string;
  estimatedGas?: string;
  exchangeRate?: string;
  fromToken?: Token | null;
  toToken?: Token | null;
  onBack: () => void;
  onNextStep: () => void;
}

export const ReviewConfirm = ({
  fromAmount,
  toAmount,
  estimatedGas = "$2.50",
  exchangeRate = "1 BNB = 35.573989 USDT",
  fromToken,
  toToken,
  onBack,
  onNextStep,
}: ReviewConfirmProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [finalGasFee, setFinalGasFee] = useState(estimatedGas);
  const [luckyPercentage, setLuckyPercentage] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [gmonFee, setGmonFee] = useState<string>("");

  // Read pool reserves to estimate GMON fee equivalent
  const reserves = usePoolReserves();

  // Roulette options with dramatic descriptions
  const rouletteOptions = [
    {
      fee: "$0.01",
      label: "Lucky Day!",
      color: "#10B981",
      probability: "Miracle",
    },
    {
      fee: "$1.25",
      label: "Sweet Deal",
      color: "#3B82F6",
      probability: "Rare",
    },
    {
      fee: estimatedGas,
      label: "Fair Deal",
      color: "#6E54FF",
      probability: "Destined",
    },
    {
      fee: "$5.00",
      label: "Ouch Zone",
      color: "#F59E0B",
      probability: "Common",
    },
    {
      fee: "$15.00",
      label: "Whale Tax",
      color: "#EF4444",
      probability: "Painful",
    },
    {
      fee: "$50.00",
      label: "Highway Robbery",
      color: "#DC2626",
      probability: "Nightmare",
    },
  ];

  // Find the index of the real gas fee
  const realGasIndex = rouletteOptions.findIndex(
    (option) => option.fee === estimatedGas
  );
  const targetIndex = realGasIndex !== -1 ? realGasIndex : 2; // Default to fair deal if not found

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);

    // Calculate rotation to land on the real gas fee
    const segmentAngle = 360 / rouletteOptions.length;

    // We want the pointer at top (12 o'clock) to land on the target segment
    // The pointer points downward into the wheel
    const targetAngle = targetIndex * segmentAngle + segmentAngle / 2;

    // Add multiple full rotations for dramatic effect
    const spins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.3); // Small random variation
    const finalRotation = spins * 360 + targetAngle + randomOffset;

    setRotation((prev) => prev + finalRotation);

    // After spinning animation completes
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      setFinalGasFee(rouletteOptions[targetIndex].fee);
      // Generate a consistent lucky percentage for this spin
      const lucky = Math.floor(Math.random() * 30 + 10);
      setLuckyPercentage(lucky);

      // Estimate GMON-denominated fee taken from pool as a % of fromAmount in native
      try {
        const fromAmt = parseFloat(fromAmount.replace(/,/g, "")) || 0;
        const feeNative = (fromAmt * lucky) / 100; // % of input as "gas fee"
        const r = reserves.data as readonly [bigint, bigint] | undefined;
        if (r && r[0] > 0n && r[1] > 0n && feeNative > 0) {
          const reserveETH = Number(r[0]);
          const reserveGMON = Number(r[1]);
          const priceGMONPerETH = reserveGMON / reserveETH;
          const feeGmon = feeNative * priceGMONPerETH;
          setGmonFee(`${feeGmon.toFixed(6)} GMON`);
        } else {
          setGmonFee("");
        }
      } catch {
        setGmonFee("");
      }
    }, 4000);
  };

  useEffect(() => {
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${rotation}deg)`;
    }
  }, [rotation]);

  // Reset state when estimatedGas changes (new swap)
  useEffect(() => {
    setHasSpun(false);
    setIsSpinning(false);
    setFinalGasFee(estimatedGas);
    setLuckyPercentage(0);
    setRotation(0);
    setGmonFee("");
  }, [estimatedGas]);

  return (
    <div className="glass-card rounded-3xl p-8 relative shadow-2xl max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🎰 GMON Gas Roulette</h2>
        <p className="text-white/70 text-lg">Spin to determine your GMON-denominated fee from our pool.</p>
        {!hasSpun && (
          <p className="text-pastel-yellow text-sm mt-2">Spinning the wheel of GMON destiny...</p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Roulette Wheel */}
        <div className="flex-1 flex justify-center">
          <div className="relative">
            {/* Spinning effect background */}
            {isSpinning && (
              <div
                className="absolute inset-0 w-80 h-80 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: "#6E54FF" }}
              ></div>
            )}

            {/* Wheel Container */}
            <div className="relative w-80 h-80">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
                <div
                  className={`w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent ${
                    isSpinning ? "" : ""
                  }`}
                  style={{ borderBottomColor: "#6E54FF" }}
                />
              </div>

              {/* Spinning Wheel */}
              <div
                ref={wheelRef}
                className={`w-full h-full rounded-full border-4 relative overflow-hidden transition-transform duration-[4000ms] ease-out ${
                  isSpinning ? "" : ""
                }`}
                style={{
                  borderColor: "#6E54FF",
                  background: `conic-gradient(${rouletteOptions
                    .map((option, index) => {
                      const segmentAngle = 360 / rouletteOptions.length;
                      const startAngle = index * segmentAngle;
                      const endAngle = startAngle + segmentAngle;
                      return `${option.color} ${startAngle}deg ${endAngle}deg`;
                    })
                    .join(", ")})`,
                }}
              >
                {/* Text labels */}
                {rouletteOptions.map((option, index) => {
                  const segmentAngle = 360 / rouletteOptions.length;
                  const midAngle = index * segmentAngle + segmentAngle / 2;
                  const radius = 100; // Distance from center
                  const x =
                    50 +
                    radius * Math.cos(((midAngle - 90) * Math.PI) / 180) * 0.7;
                  const y =
                    50 +
                    radius * Math.sin(((midAngle - 90) * Math.PI) / 180) * 0.7;

                  return (
                    <div
                      key={index}
                      className="absolute text-center pointer-events-none"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="text-white font-bold text-xs drop-shadow-lg">
                        {option.fee}
                      </div>
                      <div className="text-white/90 text-[10px] drop-shadow-lg">
                        {option.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Center Hub */}
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg z-10"
                style={{ backgroundColor: "#6E54FF" }}
              >
                🎰
              </div>
            </div>

            {/* Spin Button */}
            {!hasSpun && (
              <div className="text-center mt-6">
                <button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  className={`px-8 py-4 rounded-full font-bold text-white text-lg transition-all ${
                    isSpinning
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-105 hover:shadow-lg"
                  }`}
                  style={{ backgroundColor: "#6E54FF" }}
                >
                  {isSpinning ? (
                    <span className="flex items-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Spinning...
                    </span>
                  ) : (
                    "🎲 SPIN THE GMON ROULETTE"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="flex-1 space-y-6">
          {/* Swap Container */}
          <div>
            {/* Swap Summary */}
            <div className="glass-dark rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                📊 Swap Summary
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#6E54FF" }}
                    >
                      <span className="text-xs font-bold text-white">B</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{fromToken?.symbol || "MON"}</div>
                      <div className="text-white/70 text-sm">From</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-xl font-light">
                      {fromAmount}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white">↓</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-pastel-mint rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">₮</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{toToken?.symbol || "GMON"}</div>
                      <div className="text-white/70 text-sm">To</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-xl font-light">
                      {toAmount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pool Container */}
          <div>
            {/* Gas Fee Result */}
            <div className="glass-dark rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center">⛽ Fee Verdict</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Exchange Rate:</span>
                  <span className="text-white text-sm">{exchangeRate}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white/70">Selected Gas Fee (fiat est.):</span>
                  <span
                    className={`font-bold text-lg ${
                      hasSpun ? "text-pastel-mint" : "text-white/50"
                    }`}
                  >
                    {hasSpun ? finalGasFee : "???"}
                  </span>
                </div>

                {hasSpun && gmonFee && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">GMON Fee (from pool):</span>
                    <span className="text-pastel-mint font-semibold">{gmonFee}</span>
                  </div>
                )}

                {reserves.data && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70">
                    <div className="glass-dark rounded-xl p-3">
                      <div className="opacity-80">Pool Native Reserve</div>
                      <div className="text-white font-semibold truncate">{String((reserves.data as readonly [bigint, bigint])[0])}</div>
                    </div>
                    <div className="glass-dark rounded-xl p-3">
                      <div className="opacity-80">Pool GMON Reserve</div>
                      <div className="text-white font-semibold truncate">{String((reserves.data as readonly [bigint, bigint])[1])}</div>
                    </div>
                  </div>
                )}

                {hasSpun && (
                  <div className="mt-4 p-3 bg-pastel-mint/20 rounded-lg border border-pastel-mint/30">
                    <p className="text-pastel-mint text-sm">
                      <span className="mr-2">🎉</span>
                      The blockchain smiled upon you! Only {luckyPercentage}% of
                      users get fees this good!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Container */}
          {hasSpun && (
            <div>
              <div className="flex space-x-4">
                <button
                  onClick={onBack}
                  className="flex-1 text-white/70 font-semibold py-4 px-6 rounded-2xl border border-white/20 hover:bg-white/10 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={onNextStep}
                  className="flex text-white font-semibold py-4 px-6 rounded-2xl transition-all hover:scale-105"
                  style={{ backgroundColor: "#6E54FF" }}
                >
                  Accept GMON Fee →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSpinning && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="glass-dark rounded-full px-6 py-2">
            <p className="text-pastel-yellow text-sm flex items-center">
              <span className="animate-spin mr-2">🎪</span>
              The GMON roulette is spinning...
              <span className="ml-2">✨</span>
            </p>
          </div>
        </div>
      )}

      {hasSpun && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="glass-dark rounded-full px-6 py-2 border border-green-500/30">
            <p className="text-pastel-mint text-sm flex items-center">
              <span className="mr-2">🎯</span>
              Your GMON fee has been selected!
              <span className="ml-2 animate-spin">💫</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
