import React from 'react';
import { Button } from '@/components/ui/button';
import { type Token } from '@/lib/constants';

interface BalancePanelProps {
  balances: Record<string, number>;
  chances: number;
  isConnected: boolean;
  address?: string;
  connectors: readonly any[];
  isConnecting: boolean;
  chainId?: number;
  onConnect: (connector: any) => void;
  onDisconnect: () => void;
  onSwitchNetwork?: () => void; 
}

export function BalancePanel({ 
  balances, 
  chances, 
  isConnected, 
  address, 
  connectors, 
  isConnecting, 
  chainId,
  onConnect, 
  onDisconnect,
  onSwitchNetwork, 
}: BalancePanelProps) {
  
  // Debug the connection state received by BalancePanel
  console.log('🎮 BalancePanel connection state:', {
    isConnected,
    address,
    chainId,
    hasBalances: Object.values(balances).some(b => b > 0),
    balances
  });
  
  const isCorrectNetwork = chainId === 10143;

  return (
    <div 
      className="fixed top-2 left-2 sm:top-4 sm:left-4 p-3 sm:p-4 bg-white/80 rounded-lg shadow-md backdrop-blur-sm z-30 text-sm sm:text-base"
      style={{ pointerEvents: 'auto' }}
    >
      <h2 className="text-lg font-bold">Balances</h2>
      {Object.entries(balances).map(([token, balance]) => (
        <p key={token}>{token}: {balance.toFixed(4)}</p>
      ))}
      <h2 className="text-lg font-bold mt-2">Chances</h2>
      <p>{chances}</p>
     
      <div className="mt-4">
        {isConnected ? (
          <div>
            <p className="text-xs truncate">Connected: {address}</p>
            {chainId && (
              <p className="text-xs">
                Network: {isCorrectNetwork ? '✅ Monad Testnet' : `❌ Chain ${chainId}`}
              </p>
            )}
            {!isCorrectNetwork && onSwitchNetwork && (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={onSwitchNetwork}
                className="mt-1 w-full mb-2 min-h-[40px] sm:min-h-auto"
              >
                Switch to Monad Testnet
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onDisconnect} 
              className="mt-1 w-full min-h-[40px] sm:min-h-auto"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
           
          </div>
        )}
      </div>
    </div>
  );
} 