"use client";

import { CheckCircle, Circle, Lock, Star } from "lucide-react";
import { Text } from "../retroui/Text";
import { UserProfile } from "@/lib/api-client";

interface ProgressTrackerProps {
  userProfile: UserProfile;
}

export function ProgressTracker({ userProfile }: ProgressTrackerProps) {
  const { scannedQRs, phaseProgress } = userProfile;
  const totalQRs = phaseProgress.totalQRs;
  const nextQROrder = phaseProgress.nextQR?.sequenceOrder || null;

  // Get the rarity and scanned status for a specific QR by sequence order
  const getQRInfo = (sequenceOrder: number) => {
    const scannedQR = scannedQRs.find(scan => scan.qrCode.sequenceOrder === sequenceOrder);
    return {
      isScanned: !!scannedQR,
      rarity: scannedQR?.qrCode.rarity || 'NORMAL',
      scannedAt: scannedQR?.scannedAt,
      tokensEarned: scannedQR?.tokensEarned
    };
  };

  const getQRStatus = (sequenceOrder: number) => {
    const qrInfo = getQRInfo(sequenceOrder);
    if (qrInfo.isScanned) return "completed";
    if (sequenceOrder === nextQROrder) return "current";
    if (nextQROrder && sequenceOrder < nextQROrder) return "available";
    return "locked";
  };

  const getStatusIcon = (sequenceOrder: number) => {
    const status = getQRStatus(sequenceOrder);
    const qrInfo = getQRInfo(sequenceOrder);
    
    switch (status) {
      case "completed":
        return (
          <div className="relative">
            <CheckCircle className="w-5 h-5 text-green-600" />
            {qrInfo.rarity === 'RARE' && (
              <Star className="w-3 h-3 text-blue-500 absolute -top-1 -right-1" />
            )}
            {qrInfo.rarity === 'LEGENDARY' && (
              <Star className="w-3 h-3 text-purple-500 absolute -top-1 -right-1" />
            )}
          </div>
        );
      case "current":
        return <Circle className="w-5 h-5 text-blue-600 animate-pulse" />;
      case "available":
        return <Circle className="w-5 h-5 text-orange-500" />;
      case "locked":
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (sequenceOrder: number) => {
    const status = getQRStatus(sequenceOrder);
    const qrInfo = getQRInfo(sequenceOrder);
    
    switch (status) {
      case "completed":
        if (qrInfo.rarity === 'LEGENDARY') return "bg-purple-50 border-purple-200 text-purple-700";
        if (qrInfo.rarity === 'RARE') return "bg-blue-50 border-blue-200 text-blue-700";
        return "bg-green-50 border-green-200 text-green-700";
      case "current":
        return "bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-200";
      case "available":
        return "bg-orange-50 border-orange-200 text-orange-700";
      case "locked":
        return "bg-gray-50 border-gray-200 text-gray-400";
      default:
        return "bg-gray-50 border-gray-200 text-gray-400";
    }
  };

  const progressPercentage = (phaseProgress.scannedQRs / totalQRs) * 100;

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="text-center mb-6">
        <Text as="h2" className="text-xl font-bold text-gray-900 mb-2">
          Progress Tracker
        </Text>
        <div className="flex items-center justify-center gap-4 mb-4">
          <Text className="text-gray-600">
            {phaseProgress.scannedQRs} / {totalQRs} QR Codes Found
          </Text>
          <Text className="text-gray-700 font-bold">
            {Math.round(progressPercentage)}%
          </Text>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {phaseProgress.nextQR && (
          <Text className="text-blue-600 font-medium">
            Next: {phaseProgress.nextQR.name} (#{phaseProgress.nextQR.sequenceOrder})
          </Text>
        )}
      </div>

      {/* QR Grid */}
      <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
        {Array.from({ length: totalQRs }, (_, i) => {
          const sequenceOrder = i + 1;
          const qrInfo = getQRInfo(sequenceOrder);

          return (
            <div
              key={sequenceOrder}
              className={`
                flex flex-col items-center justify-center p-2 rounded border-2 transition-all
                ${getStatusColor(sequenceOrder)}
              `}
              title={qrInfo.isScanned ? `Scanned: ${qrInfo.tokensEarned} tokens` : `QR #${sequenceOrder}`}
            >
              {getStatusIcon(sequenceOrder)}
              <Text className="text-xs font-medium mt-1">{sequenceOrder}</Text>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <Text className="text-gray-600">Completed</Text>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="w-4 h-4 text-blue-600" />
          <Text className="text-gray-600">Current</Text>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="w-4 h-4 text-orange-500" />
          <Text className="text-gray-600">Available</Text>
        </div>
        <div className="flex items-center gap-1">
          <Lock className="w-4 h-4 text-gray-400" />
          <Text className="text-gray-600">Locked</Text>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-purple-500" />
          <Text className="text-gray-600">Rare/Legendary</Text>
        </div>
      </div>

      {/* Recent Scans */}
      {scannedQRs.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <Text as="h3" className="text-sm font-semibold text-gray-900 mb-2">
            Recent Scans
          </Text>
          <div className="space-y-1">
            {scannedQRs
              .slice(-3)
              .reverse()
              .map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between bg-gray-50 rounded px-3 py-1"
                >
                  <div className="flex items-center gap-2">
                    <Text className="text-green-600 font-medium text-sm">
                      {scan.qrCode.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      +{scan.tokensEarned} tokens
                    </Text>
                  </div>
                  <Text className="text-gray-500 text-xs">
                    {new Date(scan.scannedAt).toLocaleTimeString()}
                  </Text>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
