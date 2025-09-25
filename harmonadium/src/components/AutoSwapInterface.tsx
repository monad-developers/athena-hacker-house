'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRainbowKit } from '@/hooks/useRainbowKit';
import { useAutoSwap } from '@/hooks/useAutoSwap';
import { useDebounce } from '@/hooks/useDebounce';
import { MONAD_TESTNET_CONFIG } from '@/lib/config';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Wallet, CheckCircle, XCircle, AlertCircle, Zap, Info } from 'lucide-react';
import { toast } from 'sonner';

interface AutoSwapInterfaceProps {
  targetToken?: {
    token: string;
    address: string;
    name: string;
    symbol: string;
  };
  angle?: number | null;
  isStableAngle: boolean;
  onAutoSwapExecuted?: (success: boolean, txHash?: string) => void;
}

export function AutoSwapInterface({
  targetToken,
  angle,
  isStableAngle,
  onAutoSwapExecuted
}: AutoSwapInterfaceProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  // Removed unused WMON-related state since we use native MON now
  const lastSwapRef = useRef<{ angle: number; token: string; timestamp: number } | null>(null);

  const {
    account,
    isConnected,
    isConnecting,
    error: rainbowKitError,
    // connect, disconnect, - Removed unused RainbowKit methods
    switchToMonadTestnet,
    sendTransaction,
    requestSwapAuthorization,
    isAuthorizedForSwaps,
    // wrapMonad, getWMONBalance - Removed since we use native MON now
  } = useRainbowKit();

  const { isEnabled, swapHistory, queueStatus, executeSwap } = useAutoSwap();

  const isOnMonadTestnet = account?.chainId === MONAD_TESTNET_CONFIG.chainId;

  useEffect(() => {
    setIsMounted(true);
    
    // Debug: Check if wallet is available
    if (typeof window !== 'undefined') {
      console.log('🔍 Debug - Window.ethereum available:', !!window.ethereum);
      console.log('🔍 Debug - RainbowKit initialized');
    }
  }, []);

  // Removed WMON balance fetching since we use native MON now

  const handleAutoSwap = useCallback(async () => {
    if (!account || !targetToken || angle === null || angle === undefined) return;

    setIsExecutingSwap(true);
    console.log(`🚀 Auto-executing swap for ${angle}° → ${targetToken.symbol}`);

    try {
      const result = await executeSwap(angle, account.address, sendTransaction);

      // Update last swap reference to prevent duplicates
      lastSwapRef.current = {
        angle: angle,
        token: targetToken.symbol,
        timestamp: Date.now()
      };

      // Show toast notification
      if (result.success) {
        toast.success(`Swap successful! ${angle}° → ${targetToken.symbol}`, {
          description: result.txHash ? `TX: ${result.txHash.slice(0, 10)}...` : undefined,
          duration: 5000,
        });
      } else {
        toast.error(`Swap failed: ${result.error || 'Unknown error'}`, {
          duration: 6000,
        });
      }

      onAutoSwapExecuted?.(result.success, result.txHash);
    } catch (error) {
      console.error('Auto-swap execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Auto-swap failed: ${errorMessage}`, {
        duration: 6000,
      });
      onAutoSwapExecuted?.(false);
    } finally {
      setIsExecutingSwap(false);
    }
  }, [account, targetToken, angle, executeSwap, sendTransaction, onAutoSwapExecuted]);

  // Debounce the angle to prevent rapid swaps
  const debouncedAngle = useDebounce(angle, 2000); // 2 second debounce
  const debouncedIsStable = useDebounce(isStableAngle, 1000); // 1 second debounce for stability

  // Auto-execute swap when angle is stable and authorized
  useEffect(() => {
    if (
      debouncedIsStable &&
      targetToken &&
      debouncedAngle !== null &&
      debouncedAngle !== undefined &&
      isAuthorizedForSwaps &&
      account &&
      isOnMonadTestnet &&
      !isExecutingSwap
    ) {
      // Check if we've already swapped for this angle/token combination recently
      const now = Date.now();
      const lastSwap = lastSwapRef.current;
      
      if (lastSwap && 
          lastSwap.angle === debouncedAngle && 
          lastSwap.token === targetToken.symbol &&
          (now - lastSwap.timestamp) < 10000) { // 10 second cooldown
        console.log('Skipping duplicate swap - too recent');
        return;
      }

      handleAutoSwap();
    }
  }, [debouncedIsStable, targetToken, debouncedAngle, isAuthorizedForSwaps, account, isOnMonadTestnet, isExecutingSwap, handleAutoSwap]);

  const handleAuthorize = async () => {
    try {
      await requestSwapAuthorization();
      toast.success('Swap authorization successful!', {
        description: 'You can now make automatic swaps based on lid angle',
        duration: 5000,
      });
    } catch (error) {
      console.error('Authorization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Authorization failed: ${errorMessage}`, {
        duration: 6000,
      });
    }
  };
  
  // Mark as used to prevent lint warning
  void handleAuthorize;

  // Removed handleWrapMON since we use native MON directly now

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Swap Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Loading interface...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-2 hover:border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Auto-Swap Interface
          {isEnabled && <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
            {/* Debug Information */}
            {process.env.NODE_ENV === 'development' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-xs space-y-2">
                    <div>Wallet Available: {typeof window !== 'undefined' ? (window.ethereum ? 'Yes' : 'No') : 'Unknown'}</div>
                    <div>Connection Status: {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Not Connected'}</div>
                    <div>Authorization: {isAuthorizedForSwaps ? 'Authorized' : 'Not Authorized'}</div>
                    {isConnected && isAuthorizedForSwaps && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            // Execute a real swap at 119° angle (WSOL)
                            if (account) {
                              executeSwap(119, account.address, sendTransaction);
                            }
                          }} 
                          disabled={isExecutingSwap || !account}
                        >
                          {isExecutingSwap ? 'Swapping...' : 'Swap 119° → WSOL'}
                        </Button>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

        {rainbowKitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {rainbowKitError}
            </AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="text-center space-y-4">
            <div className="p-6 border-2 border-dashed rounded-lg">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your wallet to enable automatic angle-based token swapping
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
              {!isConnecting && (
                <p className="text-xs text-muted-foreground mt-2">
                  Supports MetaMask, WalletConnect, and more
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Wallet Status */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Connected Wallet:</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    <Wallet className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                  <ConnectButton />
                </div>
              </div>
              <div className="font-mono text-sm break-all">{account?.address}</div>
                  <div className="mt-2">
                    <div className="text-sm text-muted-foreground">Native MON Balance:</div>
                    <div className="font-mono text-lg font-semibold">
                      {account ? parseFloat(account.balance).toFixed(4) : '0.0000'} MON
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      ✅ Ready for angle-based swaps (no wrapping needed)
                    </div>
                  </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                💡 Get more MON from the{' '}
                <a 
                  href="https://faucet.monad.xyz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Monad faucet
                </a>{' '}
                if needed.
              </div>
            </div>

            {!isOnMonadTestnet && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Switch to Monad Testnet to enable automatic swaps.
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={switchToMonadTestnet}
                  >
                    Switch Network
                  </Button>
                </AlertDescription>
              </Alert>
            )}


            {/* Swap Queue Status */}
            {queueStatus.total > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-orange-800">
                    🔄 Swap Queue ({queueStatus.total} swaps)
                  </div>
                  <div className="flex gap-1 text-xs">
                    {queueStatus.pending > 0 && (
                      <Badge variant="outline" className="text-orange-600">
                        {queueStatus.pending} pending
                      </Badge>
                    )}
                    {queueStatus.processing > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {queueStatus.processing} processing
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-orange-700">
                  Swaps are queued to prevent cancellation during lid movement. Each swap executes in order.
                </div>
                {queueStatus.queue.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {queueStatus.queue.slice(0, 3).map((swap) => (
                      <div key={swap.id} className="flex justify-between items-center text-xs p-1 bg-orange-100 rounded">
                        <span>{swap.angle.toFixed(1)}° → {swap.targetToken}</span>
                        <span className={`
                          ${swap.status === 'pending' ? 'text-orange-600' : ''}
                          ${swap.status === 'processing' ? 'text-blue-600' : ''}
                          ${swap.status === 'completed' ? 'text-green-600' : ''}
                          ${swap.status === 'failed' ? 'text-red-600' : ''}
                        `}>
                          {swap.status}
                        </span>
                      </div>
                    ))}
                    {queueStatus.queue.length > 3 && (
                      <div className="text-xs text-center text-orange-600">
                        ... and {queueStatus.queue.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Current Swap Status */}
            {angle !== null && angle !== undefined && targetToken && isAuthorizedForSwaps && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">
                    <strong>{angle.toFixed(1)}° → {targetToken.symbol}</strong>
                  </div>
                  {isStableAngle && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {isExecutingSwap ? 'Executing...' : 'Ready'}
                    </Badge>
                  )}
                </div>
                {isExecutingSwap && (
                  <div className="space-y-2">
                    <Progress value={undefined} className="h-1" />
                    <div className="text-xs text-center text-blue-600">
                      Executing automatic swap to {targetToken.symbol}...
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Help for failed swaps */}
                {swapHistory.length > 0 && swapHistory[0] && !swapHistory[0].success && swapHistory[0].error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="text-sm">{swapHistory[0].error}</p>
                        {swapHistory[0].error.includes('MON balance') && (
                          <div className="text-xs text-muted-foreground">
                            💡 <strong>Need more MON?</strong> Visit the{' '}
                            <a 
                              href="https://faucet.monad.xyz" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Monad Faucet
                            </a>{' '}
                            to get MON for swapping.
                          </div>
                        )}
                        {swapHistory[0].error.includes('Internal JSON-RPC error') && (
                          <div className="text-xs text-muted-foreground">
                            💡 <strong>Network Issue:</strong> Transaction failed on Monad testnet. Try again or check your network connection.
                          </div>
                        )}
                        {swapHistory[0].error.includes('User rejected') && (
                          <div className="text-xs text-muted-foreground">
                            💡 <strong>Transaction Rejected:</strong> You cancelled the transaction in MetaMask.
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

            {/* Recent Swap History */}
            {swapHistory.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Recent Auto-Swaps</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {swapHistory.slice(0, 5).map((swap, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-secondary/30 rounded text-xs">
                      <div>
                        {swap.angle.toFixed(1)}° → {swap.token}
                      </div>
                      <div className="flex items-center gap-2">
                        {swap.success ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="h-2 w-2 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs" title={swap.error}>
                            <XCircle className="h-2 w-2 mr-1" />
                            Failed
                          </Badge>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(swap.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}