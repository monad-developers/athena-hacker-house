'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLidAngleSensor } from '@/hooks/useLidAngleSensor';
import { useAngleStabilityDebounce } from '@/hooks/useDebounce';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';
import { getTargetTokenForAngle, MIN_VISIBLE_ANGLE, MAX_OPENING_ANGLE, DEBOUNCE_TIME_MS } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, AlertCircle, Music } from 'lucide-react';

interface AngleSensorDisplayProps {
  onAngleUpdate?: (angle: number, targetToken: {
    token: string;
    address: string;
    name: string;
    symbol: string;
  } | null) => void;
  onAngleStable: (angle: number, targetToken: {
    token: string;
    address: string;
    name: string;
    symbol: string;
  } | null, isStable: boolean) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export function AngleSensorDisplay({ onAngleUpdate, onAngleStable, videoRef }: AngleSensorDisplayProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const lastAngleRef = useRef<number | null>(null);
  const movementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    currentAngle,
    isConnected,
    error,
    connect,
    disconnect,
    isSupported
  } = useLidAngleSensor();

  const { playMovementSound, stopMovementSound, continueMovementSound, setVideoRef } = useAudioFeedback();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Connect video element to audio hook for synchronized playback
  useEffect(() => {
    if (videoRef?.current) {
      setVideoRef(videoRef.current);
      console.log('🎥 Video connected to audio feedback system');
    }
  }, [videoRef, setVideoRef]);

  // Audio feedback for lid movement - continuous playback
  useEffect(() => {
    if (currentAngle === null || currentAngle === undefined) return;

    const lastAngle = lastAngleRef.current;

    // Detect ANY movement (more than 1 degree change)
    if (lastAngle !== null && Math.abs(currentAngle - lastAngle) > 1) {
      console.log(`🎵 Lid movement detected: ${lastAngle}° → ${currentAngle}°`);

      // Clear any existing movement timeout (movement is continuing)
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
        movementTimeoutRef.current = null;
      }

      // Start or continue audio playback
      if (!isAudioPlaying) {
        playMovementSound(); // Start fresh
        setIsAudioPlaying(true);
      } else {
        continueMovementSound(); // Continue existing playback
      }

      // Set new timeout for when movement stops
      movementTimeoutRef.current = setTimeout(() => {
        console.log('🔇 No movement for 1 second - stopping audio');
        stopMovementSound(); // This will start the 1-second fade timeout
        setTimeout(() => {
          setIsAudioPlaying(false); // Update UI state after fade completes
        }, 1100); // 1 sec delay + 0.1 sec fade
      }, 1000); // 1 second of no movement triggers stop sequence
    }

    lastAngleRef.current = currentAngle;
  }, [currentAngle, playMovementSound, continueMovementSound, stopMovementSound, isAudioPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }
      stopMovementSound();
    };
  }, [stopMovementSound]);

  const { stableAngle, isStabilizing, countdown } = useAngleStabilityDebounce(
    (currentAngle !== null && currentAngle !== undefined && currentAngle >= MIN_VISIBLE_ANGLE) ? currentAngle : null,
    DEBOUNCE_TIME_MS
  );

  const targetToken = (currentAngle !== null && currentAngle !== undefined) ? getTargetTokenForAngle(currentAngle) : null;
  const stableTargetToken = stableAngle ? getTargetTokenForAngle(stableAngle) : null;

  const angleProgress = (currentAngle !== null && currentAngle !== undefined)
    ? Math.max(0, Math.min(100, ((currentAngle - MIN_VISIBLE_ANGLE) / (MAX_OPENING_ANGLE - MIN_VISIBLE_ANGLE)) * 100))
    : 0;

  React.useEffect(() => {
    // Notify about live angle updates for real-time card selection
    if (currentAngle !== null && currentAngle !== undefined && targetToken && onAngleUpdate) {
      const simplifiedToken = {
        token: targetToken.symbol,
        address: targetToken.address,
        name: targetToken.name,
        symbol: targetToken.symbol
      };
      onAngleUpdate(currentAngle, simplifiedToken);
    }
  }, [currentAngle, targetToken, onAngleUpdate]);

  React.useEffect(() => {
    // Notify about stable angles for swap execution
    if (currentAngle !== null && currentAngle !== undefined && targetToken) {
      // Convert the full token structure to simplified structure expected by callback
      const simplifiedToken = {
        token: targetToken.symbol,
        address: targetToken.address,
        name: targetToken.name,
        symbol: targetToken.symbol
      };
      onAngleStable(currentAngle, simplifiedToken, stableAngle !== null && !isStabilizing);
    }
  }, [currentAngle, targetToken, stableAngle, isStabilizing, onAngleStable]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MacBook Lid Angle Sensor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Loading sensor...</div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          WebSocket not supported in this browser
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="text-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>MacBook Lid Angle Sensor</span>
          <div className="flex items-center gap-2">
            {isAudioPlaying && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">
                <Music className="h-3 w-3" />
                Playing
              </Badge>
            )}
            {isConnected ? (
                <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 border border-green-300">
                  <Wifi className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1 bg-red-100 text-red-800 border border-red-300">
                  <WifiOff className="h-3 w-3" />
                  Disconnected
                </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={isConnected ? disconnect : connect}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Angle:</span>
            <span className="font-mono">
              {currentAngle !== null && currentAngle !== undefined ? `${currentAngle.toFixed(1)}°` : '--'}
            </span>
          </div>
          <Progress value={angleProgress} className="h-3 transition-all duration-300" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{MIN_VISIBLE_ANGLE}°</span>
            <span>{MAX_OPENING_ANGLE}°</span>
          </div>
        </div>

        {targetToken && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg transform transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">Target Token: {targetToken.symbol}</div>
                  <div className="text-sm text-gray-600">{targetToken.name}</div>
              </div>
              <Badge variant="outline" className="bg-white border-blue-300 text-blue-700 font-semibold">{targetToken.symbol}</Badge>
            </div>
          </div>
        )}

        {isStabilizing && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800">
                  🔄 Angle stabilizing... Swap will execute in:
                </div>
              <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 font-bold text-lg px-3 py-1">{countdown}s</Badge>
            </div>
          </div>
        )}

        {stableAngle && stableTargetToken && !isStabilizing && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg animate-pulse-glow">
              <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-lg">✅</span>
                Angle stable at {stableAngle.toFixed(1)}° → Ready to swap to {stableTargetToken.symbol}
              </div>
            </div>
          )}

        {(currentAngle !== null && currentAngle !== undefined && currentAngle < MIN_VISIBLE_ANGLE) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Angle too low ({currentAngle.toFixed(1)}°) - screen visibility compromised.
              Minimum angle: {MIN_VISIBLE_ANGLE}°
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}