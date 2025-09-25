'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useReadContracts } from 'wagmi';
import { MONAD_TESTNET_TOKENS, MONAD_TESTNET_CONFIG } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { formatUnits, erc20Abi } from 'viem';
import { toast } from 'sonner';

interface TokenBalance {
  token: typeof MONAD_TESTNET_TOKENS[keyof typeof MONAD_TESTNET_TOKENS];
  balance: string;
  formattedBalance: string;
  balanceInWei: bigint;
  isLoading: boolean;
  error?: string;
}

interface TokenBalanceDisplayProps {
  refreshTrigger?: number; // External trigger to refresh balances
  showSwapPairs?: boolean;
  highlightToken?: string; // Highlight a specific token
}

export function TokenBalanceDisplay({
  refreshTrigger = 0,
  showSwapPairs = false,
  highlightToken
}: TokenBalanceDisplayProps) {
  // This component fetches REAL token balances from the blockchain
  // - Native MON balance via useBalance hook
  // - ERC-20 token balances via useReadContracts with balanceOf calls
  // - Updates automatically when swaps are executed
  // - Shows realistic portfolio values using proper exchange rates
  const { address, isConnected, chainId } = useAccount();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const isOnMonadTestnet = chainId === MONAD_TESTNET_CONFIG.chainId;

  // Get native MON balance
  const {
    data: nativeBalance,
    isLoading: isNativeLoading,
    refetch: refetchNative,
    error: nativeError
  } = useBalance({
    address,
    chainId: MONAD_TESTNET_CONFIG.chainId,
    query: { enabled: !!address && isOnMonadTestnet }
  });

  // ERC-20 token contracts for balance reading
  const erc20Contracts = Object.values(MONAD_TESTNET_TOKENS)
    .filter(token => token.symbol !== 'MON') // Exclude native token
    .map(token => ({
      address: token.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf' as const,
      args: [address as `0x${string}`],
      chainId: MONAD_TESTNET_CONFIG.chainId,
    }));

  // Read all ERC-20 token balances
  const {
    data: erc20Balances,
    isLoading: isErc20Loading,
    refetch: refetchErc20,
    error: erc20Error
  } = useReadContracts({
    contracts: erc20Contracts,
    query: {
      enabled: !!address && isOnMonadTestnet && erc20Contracts.length > 0
    }
  });

  // Update balances when data changes
  useEffect(() => {
    if (!address || !isOnMonadTestnet) {
      setBalances([]);
      return;
    }

    const newBalances: TokenBalance[] = [];

    // Add native MON balance
    newBalances.push({
      token: MONAD_TESTNET_TOKENS.MON,
      balance: nativeBalance ? formatUnits(nativeBalance.value, 18) : '0',
      formattedBalance: nativeBalance ? parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4) : '0.0000',
      balanceInWei: nativeBalance?.value || BigInt(0),
      isLoading: isNativeLoading,
      error: nativeError?.message
    });

    // Add ERC-20 token balances
    if (erc20Balances) {
      let tokenIndex = 0;
      Object.values(MONAD_TESTNET_TOKENS)
        .filter(token => token.symbol !== 'MON')
        .forEach(token => {
          const balanceResult = erc20Balances[tokenIndex];
          const balanceValue = balanceResult?.status === 'success' ? balanceResult.result as bigint : BigInt(0);

          newBalances.push({
            token,
            balance: formatUnits(balanceValue, token.decimals),
            formattedBalance: parseFloat(formatUnits(balanceValue, token.decimals)).toFixed(token.decimals <= 8 ? token.decimals : 4),
            balanceInWei: balanceValue,
            isLoading: isErc20Loading,
            error: balanceResult?.status === 'failure' ? 'Failed to load' : undefined
          });

          tokenIndex++;
        });
    }

    setBalances(newBalances);
    setLastUpdate(Date.now());
  }, [address, isOnMonadTestnet, nativeBalance, erc20Balances, isNativeLoading, isErc20Loading, nativeError, erc20Error]);


  const handleRefresh = useCallback(async () => {
    if (!address || !isOnMonadTestnet) return;

    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchNative(),
        refetchErc20()
      ]);
      toast.success('Token balances updated', {
        description: `Refreshed at ${new Date().toLocaleTimeString()}`,
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to refresh balances:', error);
      toast.error('Failed to refresh balances', {
        description: 'Please try again',
        duration: 3000
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [address, isOnMonadTestnet, refetchNative, refetchErc20]);

  // Refresh balances when external trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      handleRefresh();
    }
  }, [refreshTrigger, handleRefresh]);

  const getTotalValueInMON = useCallback(() => {
    // Calculate total portfolio value using realistic exchange rates
    return balances.reduce((total, balance) => {
      const tokenBalance = parseFloat(balance.balance);
      if (tokenBalance === 0) return total;
      
      // Use realistic exchange rates (same as used in swap logic)
      let valueInMON = 0;
      
      switch (balance.token.symbol) {
        case 'MON':
          valueInMON = tokenBalance; // 1:1 for native token
          break;
        case 'USDC':
        case 'USDT':
          valueInMON = tokenBalance / 2000; // 1 MON = 2000 USDC/USDT
          break;
        case 'WBTC':
          valueInMON = tokenBalance / 0.00005; // 1 MON = 0.00005 WBTC
          break;
        case 'WETH':
          valueInMON = tokenBalance / 0.8; // 1 MON = 0.8 WETH
          break;
        case 'WSOL':
          valueInMON = tokenBalance / 100; // 1 MON = 100 WSOL
          break;
        default:
          valueInMON = tokenBalance; // Fallback to 1:1
      }
      
      return total + valueInMON;
    }, 0);
  }, [balances]);

  const getSwapPairsForToken = useCallback((tokenSymbol: string) => {
    return Object.values(MONAD_TESTNET_TOKENS)
      .filter(token => token.symbol !== tokenSymbol)
      .map(token => `${tokenSymbol}→${token.symbol}`);
  }, []);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Connect your wallet to view token balances
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isOnMonadTestnet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Switch to Monad Testnet to view token balances
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Balances
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Portfolio Summary */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Portfolio Value</span>
            <Badge variant="outline" className="text-blue-600">
              ~{getTotalValueInMON().toFixed(4)} MON
            </Badge>
          </div>
          <div className="text-xs text-blue-600">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>

        {/* Token Balances */}
        <div className="space-y-2">
          {balances.map((tokenBalance) => {
            const isHighlighted = highlightToken === tokenBalance.token.symbol;
            const hasBalance = parseFloat(tokenBalance.balance) > 0;

            return (
              <div
                key={tokenBalance.token.symbol}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  isHighlighted
                    ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-400'
                    : hasBalance
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Token Icon Placeholder */}
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {tokenBalance.token.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {tokenBalance.token.symbol}
                        {hasBalance && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                        {parseFloat(tokenBalance.balance) === 0 && (
                          <TrendingDown className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tokenBalance.token.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {tokenBalance.isLoading ? (
                      <div className="w-16 h-4 bg-gray-200 animate-pulse rounded" />
                    ) : tokenBalance.error ? (
                      <div className="text-red-500 text-sm">Error</div>
                    ) : (
                      <>
                        <div className="font-mono font-bold text-lg">
                          {tokenBalance.formattedBalance}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tokenBalance.token.symbol}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Swap Pairs (if enabled) */}
                {showSwapPairs && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs text-muted-foreground mb-1">Available swaps:</div>
                    <div className="flex flex-wrap gap-1">
                      {getSwapPairsForToken(tokenBalance.token.symbol).slice(0, 3).map(pair => (
                        <Badge key={pair} variant="outline" className="text-xs">
                          {pair}
                        </Badge>
                      ))}
                      {getSwapPairsForToken(tokenBalance.token.symbol).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{getSwapPairsForToken(tokenBalance.token.symbol).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {isHighlighted && (
                  <div className="mt-2 pt-2 border-t border-yellow-300">
                    <div className="text-xs text-yellow-700 font-medium">
                      🎯 Target for current angle
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground text-center p-2 bg-gray-50 rounded">
          💡 Get MON tokens from the{' '}
          <a
            href="https://faucet.monad.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Monad Faucet
          </a>
        </div>
      </CardContent>
    </Card>
  );
}