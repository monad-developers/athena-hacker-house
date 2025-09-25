'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getTargetTokenForAngle, NATIVE_TOKEN_ADDRESS, MONAD_TESTNET_TOKENS } from '@/lib/config';
import { zeroXSwapService } from '@/lib/zeroXSwap';
import { ArrowRight, Clock, Zap } from 'lucide-react';
import { ethers } from 'ethers';

interface SwapCountdownDisplayProps {
  countdown: number; // seconds remaining
  angle: number;
  sellAmount: string; // in wei
  userAddress?: string;
  isActive: boolean;
}

export function SwapCountdownDisplay({
  countdown,
  angle,
  sellAmount,
  userAddress,
  isActive
}: SwapCountdownDisplayProps) {
  const [estimatedOutput, setEstimatedOutput] = useState<string>('');
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [swapSummary, setSwapSummary] = useState<string>('');

  const sellToken = MONAD_TESTNET_TOKENS.MON; // Native MON
  const buyToken = getTargetTokenForAngle(angle);

  // Calculate progress percentage (3 seconds = 100%, 2 seconds = 66%, etc.)
  const progressPercentage = Math.max(0, ((3 - countdown) / 3) * 100);

  // Get price estimate when countdown starts
  useEffect(() => {
    if (!buyToken || !userAddress || !isActive || countdown <= 0) {
      setEstimatedOutput('');
      setSwapSummary('');
      return;
    }

    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      try {
        const price = await zeroXSwapService.getPrice(
          NATIVE_TOKEN_ADDRESS,
          buyToken.address,
          sellAmount
        );

        const buyAmountFormatted = ethers.formatUnits(price.buyAmount, buyToken.decimals);
        setEstimatedOutput(parseFloat(buyAmountFormatted).toFixed(buyToken.decimals <= 8 ? buyToken.decimals : 4));

        const sellAmountFormatted = ethers.formatEther(sellAmount);
        setSwapSummary(`${parseFloat(sellAmountFormatted).toFixed(4)} ${sellToken.symbol} → ${parseFloat(buyAmountFormatted).toFixed(4)} ${buyToken.symbol}`);
      } catch (error) {
        console.warn('Failed to get price estimate:', error);
        // Use fallback calculation
        const sellAmountFormatted = ethers.formatEther(sellAmount);
        const estimatedBuyAmount = parseFloat(sellAmountFormatted) * 0.95; // 5% slippage
        setEstimatedOutput(estimatedBuyAmount.toFixed(4));
        setSwapSummary(`${parseFloat(sellAmountFormatted).toFixed(4)} ${sellToken.symbol} → ~${estimatedBuyAmount.toFixed(4)} ${buyToken.symbol}`);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [buyToken, userAddress, sellAmount, angle, isActive, countdown, sellToken]);

  if (!isActive || countdown <= 0 || !buyToken) {
    return null;
  }

  const getCountdownColor = () => {
    if (countdown === 3) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    if (countdown === 2) return 'text-orange-600 bg-orange-100 border-orange-300';
    if (countdown === 1) return 'text-red-600 bg-red-100 border-red-300';
    return 'text-green-600 bg-green-100 border-green-300';
  };

  const getCountdownEmoji = () => {
    if (countdown === 3) return '🟡';
    if (countdown === 2) return '🟠';
    if (countdown === 1) return '🔴';
    return '🟢';
  };

  return (
    <Card className={`transition-all duration-300 border-2 ${getCountdownColor()} animate-pulse`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Swap Countdown</span>
          </div>
          <Badge variant="secondary" className={`text-lg font-bold px-3 py-1 ${getCountdownColor()}`}>
            {getCountdownEmoji()} {countdown}s
          </Badge>
        </div>

        {/* Swap Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-lg border">
            {/* Sell Token */}
            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-1">
                {sellToken.symbol.charAt(0)}
              </div>
              <div className="text-sm font-medium">{sellToken.symbol}</div>
              <div className="text-xs text-muted-foreground">
                {ethers.formatEther(sellAmount)} MON
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-1 flex justify-center">
              <ArrowRight className="h-6 w-6 text-blue-500" />
            </div>

            {/* Buy Token */}
            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-1">
                {buyToken.symbol.charAt(0)}
              </div>
              <div className="text-sm font-medium">{buyToken.symbol}</div>
              <div className="text-xs text-muted-foreground">
                {isLoadingQuote ? (
                  <div className="w-12 h-3 bg-gray-200 animate-pulse rounded mx-auto" />
                ) : (
                  `~${estimatedOutput}`
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Angle stabilized at {angle.toFixed(1)}°</span>
              <span>Executing in {countdown}s</span>
            </div>
          </div>

          {/* Swap Summary */}
          {swapSummary && (
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Preparing: {swapSummary}
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Using 0x Protocol for optimal routing
              </div>
            </div>
          )}

          {/* Warning for last second */}
          {countdown === 1 && (
            <div className="text-center text-sm text-red-600 font-medium animate-bounce">
              🚨 Executing swap now!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}