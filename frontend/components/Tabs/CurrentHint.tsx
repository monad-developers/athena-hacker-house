"use client";

import { Eye, Sparkles } from "lucide-react";
import { Text } from "../retroui/Text";

interface NextQR {
  name: string;
  sequenceOrder: number;
  rarity: string;
  hint: {
    title: string;
    content: string;
  } | null;
}

interface CurrentHintProps {
  nextQR: NextQR | null;
  isPhaseComplete: boolean;
  currentPhase: string;
}

export function CurrentHint({ nextQR, isPhaseComplete, currentPhase }: CurrentHintProps) {
  // If phase is complete, show completion message
  if (isPhaseComplete) {
    return (
      <div className="relative overflow-hidden bg-primary border-2 border-black shadow-lg hover:shadow-md transition-all">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 text-6xl animate-bounce">🎉</div>
          <div className="absolute top-8 right-8 text-4xl animate-pulse">✨</div>
          <div className="absolute bottom-4 left-8 text-5xl animate-bounce delay-300">🏆</div>
        </div>
        
        <div className="relative p-8 text-center">
          <div className="inline-block bg-black text-primary px-4 py-2 border-2 border-black shadow-md mb-4 font-head font-bold text-lg">
            {currentPhase === 'PHASE_3' ? '🏆 LEGEND ACHIEVED!' : '🎯 PHASE CONQUERED!'}
          </div>
          <Text className="text-2xl font-head font-bold text-black mb-3">
            {currentPhase === 'PHASE_3' ? 'HUNT COMPLETE!' : 'PHASE COMPLETE!'}
          </Text>
          <Text className="text-black font-medium">
            {currentPhase === 'PHASE_3' 
              ? 'You are now a Token Crunchies LEGEND! 🔥' 
              : 'Ready for the next challenge? 🚀'
            }
          </Text>
        </div>
      </div>
    );
  }

  // If no next QR, show waiting message
  if (!nextQR) {
    return (
      <div className="bg-muted border-2 border-black shadow-md p-8 text-center">
        <div className="inline-block bg-black text-white px-4 py-2 border-2 border-black shadow-md mb-4 font-head font-bold">
          🔍 STANDBY MODE
        </div>
        <Text className="text-xl font-head font-bold text-black mb-2">
          No Active Mission
        </Text>
        <Text className="text-muted-foreground font-medium">
          Check back for new adventures! 🎮
        </Text>
      </div>
    );
  }

  // Get rarity styling
  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'RARE':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          accent: 'bg-blue-500',
          text: 'text-blue-900',
          glow: 'shadow-blue-200'
        };
      case 'LEGENDARY':
        return {
          bg: 'bg-purple-100',
          border: 'border-purple-500',
          accent: 'bg-purple-500',
          text: 'text-purple-900',
          glow: 'shadow-purple-200'
        };
      default:
        return {
          bg: 'bg-primary',
          border: 'border-black',
          accent: 'bg-black',
          text: 'text-black',
          glow: 'shadow-md'
        };
    }
  };

  const style = getRarityStyle(nextQR.rarity);

  return (
    <div className={`relative overflow-hidden ${style.bg} border-2 ${style.border} ${style.glow} hover:shadow-lg transition-all`}>
      {/* Animated corner decorations */}
      <div className="absolute top-0 left-0 w-8 h-8 bg-black transform -translate-x-4 -translate-y-4 rotate-45"></div>
      <div className="absolute top-0 right-0 w-8 h-8 bg-black transform translate-x-4 -translate-y-4 rotate-45"></div>
      
      {/* Rarity indicator */}
      {nextQR.rarity !== 'NORMAL' && (
        <div className="absolute top-4 right-4">
          <div className={`${style.accent} text-white px-3 py-1 border-2 border-black shadow-sm font-head font-bold text-sm flex items-center gap-1`}>
            <Sparkles className="w-4 h-4" />
            {nextQR.rarity}
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">

        {/* QR Info Card */}
        <div className="bg-white border-2 border-black shadow-md p-4">
          

          {/* Hint Section */}
          {nextQR.hint && (
            <div className="border-2 border-dashed border-black p-4 bg-accent/20">
              <div className="flex items-start gap-3">
                <div className="bg-black text-primary p-2 border-2 border-black shadow-sm">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  {nextQR.hint.title && (
                    <Text className="font-head font-bold text-black mb-2 text-lg">
                      📍 {nextQR.hint.title}
                    </Text>
                  )}
                  <Text className="text-black font-medium leading-relaxed text-lg">
                    &ldquo;{nextQR.hint.content}&rdquo;
                  </Text>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`h-2 ${style.accent}`}></div>
    </div>
  );
}
