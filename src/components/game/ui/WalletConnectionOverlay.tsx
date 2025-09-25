import React from 'react';
import { Button } from '@/components/ui/button';
import { Connector } from 'wagmi';

interface WalletConnectionOverlayProps {
  isConnected: boolean;
  connectors: readonly Connector[];
  isConnecting: boolean;
  onConnect: (connector: any) => void;
}

export function WalletConnectionOverlay({ 
  isConnected, 
  connectors, 
  isConnecting, 
  onConnect 
}: WalletConnectionOverlayProps) {
  if (isConnected) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
      <div className='p-8 bg-white/90 rounded-lg shadow-xl text-center'>
        <h2 className='text-3xl font-bold mb-4'>Connect Your Wallet</h2>
        <p className='mb-6'>Please connect your wallet to play the game.</p>
        <div className="flex flex-col gap-2">
          {(() => {
            const metamaskConnectors = connectors.filter((connector) => 
              connector.name.toLowerCase().includes('metamask')
            );
            const connector = metamaskConnectors[0];
            
            return connector ? (
              <div className="flex flex-col gap-2">
                
                
                {/* Manual MetaMask fallback */}
                <Button 
                  onClick={async () => {
                    console.log('🔧 Manual MetaMask connect attempt');
                    if (typeof window !== 'undefined' && window.ethereum) {
                      try {
                        await window.ethereum.request({ method: 'eth_requestAccounts' });
                        console.log('✅ Manual MetaMask connection successful');
                      } catch (error) {
                        console.error('❌ Manual MetaMask connection failed:', error);
                      }
                    } else {
                      console.log('❌ MetaMask not found');
                    }
                  }}
                  variant="outline"
                  className="min-h-[48px] sm:min-h-auto text-base sm:text-sm"
                >
                  Connect MetaMask
                </Button>
              </div>
            ) : (
              <Button disabled className="min-h-[48px] sm:min-h-auto text-base sm:text-sm">
                MetaMask not detected - Please install MetaMask
              </Button>
            );
          })()}
        </div>
      </div>
    </div>
  );
} 