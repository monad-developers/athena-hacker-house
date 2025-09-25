import React, { useEffect } from 'react';
import { TOKENS, type Token } from '@/lib/constants';
import { MonBirdIcon, UsdcBirdIcon, WethBirdIcon } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { RefreshCcw, RefreshCcwDot } from 'lucide-react';

const BIRD_ICONS: Record<Token, React.FC<any>> = {
  USDC: UsdcBirdIcon,
  MON: MonBirdIcon,
  WETH: WethBirdIcon,
};

interface BirdSelectionProps {
  selectedBird: Token;
  onBirdSelect: (bird: Token) => void;
  balances: Record<Token, number>;
  onRefreshBalances?: () => Promise<void>;
}

export function BirdSelection({ selectedBird, onBirdSelect, balances, onRefreshBalances }: BirdSelectionProps) {
  const { toast } = useToast(); 
  
  // Debug log for balances
  console.log('🔍 BirdSelection render:', { selectedBird, balances });
  
  const handleBirdClick = (token: Token) => {
    console.log('🐦 Bird clicked:', { token, balance: balances[token], selectedBird });
    
    const balance = balances[token];
    const hasBalance = balance && balance > 0;
    
    if (hasBalance) {
      console.log('✅ Bird selected:', token);
      onBirdSelect(token);
    } else {
      console.log('❌ No balance for bird:', token, 'balance:', balance);
      toast({
        title: 'No Balance',
        description: `You need ${token} tokens to select this bird.`,
        variant: 'destructive'
      });
    }
  };
 
  useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 'x') {
      // Get tokens with balance
      const tokensWithBalance = (Object.keys(TOKENS) as Token[])
        .filter(token => balances[token] > 0);
      
      if (tokensWithBalance.length <= 1) return; // Need at least 2 birds to switch
      
      // Find current index and switch to next
      const currentIndex = tokensWithBalance.indexOf(selectedBird);
      const nextIndex = (currentIndex + 1) % tokensWithBalance.length;
      const nextBird = tokensWithBalance[nextIndex];
      
      console.log('🔄 Switching bird with X key:', { from: selectedBird, to: nextBird });
      onBirdSelect(nextBird);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [selectedBird, balances, onBirdSelect]);

  return (
    <div 
      className="bird-selection-ui fixed w-[240px]  bottom-4 left-2   p-4  bg-white/90 rounded-xl shadow-lg backdrop-blur-sm z-50"
      style={{ pointerEvents: 'auto' }}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Bird</h3>
      
       
      <div className="flex gap-2 sm:gap-2">
        {Object.keys(TOKENS).map(token => {
          const tokenKey = token as Token;
          const balance = balances[tokenKey] || 0;
          const isSelected = selectedBird === tokenKey;
          const hasBalance = balance > 0;
      
          return (
            <button 
              key={tokenKey} 
              onClick={(e) => {
                console.log('🖱️ Button clicked:', tokenKey, 'hasBalance:', hasBalance);
                if (!hasBalance) return;
                handleBirdClick(tokenKey);
              }} 
              disabled={!hasBalance}
              className={`
                relative p-4 sm:p-3 rounded-lg transition-all duration-200 min-h-[64px] sm:min-h-auto
                ${isSelected ? 'bg-blue-500 ring-2 ring-blue-300 shadow-lg scale-105' : 'bg-gray-100 hover:bg-gray-200'} 
                ${hasBalance ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed opacity-50'}
              `}
            >
              {React.createElement(BIRD_ICONS[tokenKey], { 
                className: `w-10 h-10 sm:w-8 sm:h-8 ${isSelected ? 'text-white' : 'text-gray-600'}` 
              })}
              <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                {balance.toFixed(4)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
} 