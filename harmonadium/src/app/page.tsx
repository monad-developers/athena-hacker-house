'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AngleSensorDisplay } from '@/components/AngleSensorDisplay';
import { FloatingNavbar } from '@/components/FloatingNavbar';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Confetti, ConfettiRef } from '@/components/ui/confetti';
import { useRainbowKit } from '@/hooks/useRainbowKit';
import { useAutoSwap } from '@/hooks/useAutoSwap';
import { useAngleStabilityDebounce } from '@/hooks/useDebounce';
import { MIN_VISIBLE_ANGLE, MONAD_TESTNET_TOKENS } from '@/lib/config';
import { toast } from 'sonner';

interface SwapEvent {
  id: string;
  timestamp: number;
  angle: number;
  token: string;
  success: boolean;
  txHash?: string;
}

export default function Home() {
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [targetToken, setTargetToken] = useState<typeof MONAD_TESTNET_TOKENS[keyof typeof MONAD_TESTNET_TOKENS] | null>(null);
  const [swapHistory, setSwapHistory] = useState<SwapEvent[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);
  const lastSwapRef = useRef<{ angle: number; token: string; timestamp: number } | null>(null);

  // Initialize hooks
  const { account, sendTransaction } = useRainbowKit();
  const { executeSwap } = useAutoSwap();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle live angle updates (for real-time card selection)
  const handleAngleUpdate = useCallback((angle: number, targetToken: {
    token: string;
    address: string;
    name: string;
    symbol: string;
  } | null) => {
    setCurrentAngle(angle);
    // Convert the simplified token object to our full token structure
    if (targetToken) {
      const fullToken = Object.values(MONAD_TESTNET_TOKENS).find(t => t.symbol === targetToken.symbol);
      setTargetToken(fullToken || null);
    } else {
      setTargetToken(null);
    }
  }, []);

  // Handle stable angle (for swap execution)
  const handleAngleStable = useCallback((angle: number, targetToken: {
    token: string;
    address: string;
    name: string;
    symbol: string;
  } | null, _isStable: boolean) => {
    // Also update live angle state to ensure consistency
    handleAngleUpdate(angle, targetToken);
  }, [handleAngleUpdate]);

  const handleSwapComplete = useCallback((success: boolean, txHash?: string) => {
    if (currentAngle && targetToken) {
      const swapEvent: SwapEvent = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        angle: currentAngle,
        token: targetToken.symbol,
        success,
        txHash,
      };

      setSwapHistory(prev => [swapEvent, ...prev.slice(0, 9)]);

      // Trigger confetti for successful swaps
      if (success && confettiRef.current) {
        confettiRef.current.fire({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#836EF9', '#60A5FA', '#34D399', '#F472B6', '#FBBF24']
        });
        
        // Additional confetti burst after a short delay
        setTimeout(() => {
          confettiRef.current?.fire({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 }
          });
          confettiRef.current?.fire({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 }
          });
        }, 300);
      }
    }
  }, [currentAngle, targetToken]);

  // Use angle stability debounce for proper 3-second countdown
  const { stableAngle, isStabilizing } = useAngleStabilityDebounce(
    (currentAngle !== null && currentAngle !== undefined && currentAngle >= MIN_VISIBLE_ANGLE) ? currentAngle : null,
    3000 // 3 second countdown
  );

  // Auto-execute swap when angle becomes stable (after 3 seconds)
  useEffect(() => {
    const executeAutoSwap = async () => {
      // Only execute when angle just became stable (not stabilizing anymore and we have a stable angle)
      if (!account || !targetToken || stableAngle === null || isStabilizing) {
        return;
      }

      // Create a unique identifier for this swap attempt
      const swapId = `${stableAngle.toFixed(1)}-${targetToken.symbol}-${Date.now()}`;
      
      // Check if this is a duplicate of the last swap
      const isSameAsLastSwap = lastSwapRef.current &&
        Math.abs(lastSwapRef.current.angle - stableAngle) < 1 && // Within 1 degree
        lastSwapRef.current.token === targetToken.symbol;

      const timeSinceLastSwap = lastSwapRef.current ? 
        (Date.now() - lastSwapRef.current.timestamp) : Infinity;

      // Prevent duplicate swaps within 3 seconds of the same angle/token
      if (isSameAsLastSwap && timeSinceLastSwap < 3000) {
        console.log(`🚫 Preventing duplicate swap - same angle/token within 3 seconds (${timeSinceLastSwap}ms ago)`);
        return;
      }

      console.log(`🚀 Auto-executing swap for stable angle ${stableAngle}° → ${targetToken.symbol} (ID: ${swapId})`);

      // Mark this swap as being processed to prevent duplicates
      lastSwapRef.current = {
        angle: stableAngle,
        token: targetToken.symbol,
        timestamp: Date.now()
      };

      try {
        const result = await executeSwap(stableAngle, account.address, sendTransaction);

        // Show toast notification
        if (result.success) {
          toast.success(`Swap successful! ${stableAngle}° → ${targetToken.symbol}`, {
            description: result.txHash ? `TX: ${result.txHash.slice(0, 10)}...` : undefined,
            duration: 5000,
          });
        } else {
          toast.error(`Swap failed: ${result.error || 'Unknown error'}`, {
            duration: 6000,
          });
        }

        handleSwapComplete(result.success, result.txHash);
      } catch (error) {
        console.error('Auto-swap execution failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Auto-swap failed: ${errorMessage}`, {
          duration: 6000,
        });
        handleSwapComplete(false);
      }
    };

    executeAutoSwap();
  }, [account, targetToken, stableAngle, isStabilizing, executeSwap, sendTransaction, handleSwapComplete]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center font-secondary">
          <div className="animate-pulse">
            {/* <img src="/Harmonad.png" alt="Harmonad" className="h-16 w-auto mx-auto mb-4" /> */}
            <h1 className="font-primary text-2xl text-white mb-2">Harmonad</h1>
            <p className="text-gray-400">Loading the vibe...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Video - Clean without overlay */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/bgMonad.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Confetti Canvas */}
      <Confetti
        ref={confettiRef}
        className="absolute inset-0 pointer-events-none z-50"
        manualstart={true}
      />

      {/* Floating Navbar */}
      <FloatingNavbar swapHistory={swapHistory} currentAngle={currentAngle} />

      {/* Main Content - Large Center Card Layout */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-6xl w-full space-y-8">


          {/* Large Glassmorphic Center Card */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 border border-white/30 rounded-3xl p-8 shadow-2xl shadow-black/30 hover:bg-gradient-to-br hover:from-white/20 hover:via-white/15 hover:to-white/10 transition-all duration-500 animate-in fade-in">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-3 font-primary">
                Harmonad
              </h1>
              <p className="text-gray-800 text-lg font-secondary">
                MacBook Lid Angle-Based Token Swapping
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mx-auto mt-4"></div>
            </div>

            {/* Cards Grid Inside Main Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Angle Sensor Display */}
              <div className="transform hover:scale-[1.02] transition-all duration-300">
                <AngleSensorDisplay
                  onAngleUpdate={handleAngleUpdate}
                  onAngleStable={handleAngleStable}
                  videoRef={videoRef}
                />
              </div>

              {/* Wallet Connection Card */}
              <div className="transform hover:scale-[1.02] transition-all duration-300">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 flex flex-col gap-6 rounded-xl py-6 shadow-xl shadow-black/20 hover:bg-white/15 transition-all duration-300">
                  <div className="px-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Wallet Connection</h3>
                    <p className="text-gray-700 text-sm mb-6">Connect your wallet to get started with Harmonad</p>
                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="text-center mt-8 pt-6 border-t border-white/20">
              <p className="text-gray-600 text-sm">
                Open your MacBook lid to different angles and watch the magic happen ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}