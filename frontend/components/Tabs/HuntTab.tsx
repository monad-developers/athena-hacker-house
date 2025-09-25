"use client";

import { Text } from "../retroui/Text";
import { Card } from "../retroui/Card";
import { Button } from "../retroui/Button";
import { UserProfile } from "@/lib/api-client";
import { getPhaseDisplayName } from "@/lib/api-client";
import { Trophy, Scan, ArrowRightLeft } from "lucide-react";
import { ProgressTracker } from "./ProgressTracker";
import { CurrentHint } from "./CurrentHint";
import { SwapWidget } from "../SwapWidget";

interface HuntTabProps {
  scannedQRs: UserProfile['scannedQRs'];
  onScanQR: () => void;
  userProfile: UserProfile | null;
}

export function HuntTab({ onScanQR, userProfile }: HuntTabProps) {

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-4xl">🔍</div>
        <Text className="text-gray-600 text-center">Loading your hunt progress...</Text>
      </div>
    );
  }

  const { phaseProgress } = userProfile;

  // Safety check for phaseProgress
  if (!phaseProgress) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-4xl">⚠️</div>
        <Text className="text-gray-600 text-center">Phase progress data is missing. Please refresh the page.</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Hint - Most Prominent */}
      <CurrentHint 
        nextQR={phaseProgress.nextQR}
        isPhaseComplete={phaseProgress.isPhaseComplete}
        currentPhase={userProfile.currentPhase}
      />

      {/* Scan Button - Prominent Call to Action */}
      <div className="text-center">
        <Button 
          onClick={onScanQR} 
          className="w-full py-4 text-lg font-semibold"
          disabled={phaseProgress.isPhaseComplete && userProfile.currentPhase === 'PHASE_3'}
        >
          <Scan className="w-5 h-5 mr-2" />
          {phaseProgress.isPhaseComplete && userProfile.currentPhase === 'PHASE_3' 
            ? 'Hunt Complete!' 
            : 'Scan QR Code'
          }
        </Button>
      </div>

      {/* QR Progress Tracker */}
      <ProgressTracker userProfile={userProfile} />

      {/* Current Phase Info */}
      <Card className="bg-white border-gray-200 rounded-lg w-full">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <Text className="text-gray-800">
              {getPhaseDisplayName(userProfile.currentPhase)}
            </Text>
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <Text className="text-2xl font-bold text-blue-600">
                {phaseProgress.scannedQRs}
              </Text>
              <Text className="text-sm text-blue-600">
                QRs Found
              </Text>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <Text className="text-2xl font-bold text-purple-600">
                {phaseProgress.totalQRs}
              </Text>
              <Text className="text-sm text-purple-600">
                Total QRs
              </Text>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Swap Widget - New Feature */}
      <Card className="bg-white border-gray-200 rounded-lg w-full">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-green-600" />
            <Text className="text-gray-800">
              Token Swap
            </Text>
          </Card.Title>
          <Text className="text-sm text-gray-600">
            Trade WMON ↔ USDT using your swap opportunities
          </Text>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>🎉 Each successful QR scan gives you 1 swap opportunity!</p>
              <p>💱 Use it to trade between WMON and USDT on Monad testnet</p>
            </div>
            <SwapWidget />
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
