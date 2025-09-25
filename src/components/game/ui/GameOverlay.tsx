import React from 'react';
import { Button } from '@/components/ui/button';
import { type Token } from '@/lib/constants';

interface GameOverlayProps {
  gameState: 'ready' | 'aiming' | 'flying' | 'hit' | 'miss' | 'swapping' | 'gameover';
  selectedBird: Token;
  onNewGame: () => void;
}

export function GameOverlay({ gameState, selectedBird, onNewGame }: GameOverlayProps) {
  if (gameState !== 'gameover') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
      <div className='p-8 bg-white/90 rounded-lg shadow-xl text-center'>
        <h2 className='text-3xl font-bold mb-4'>No more chances!</h2>
        <p className='mb-6'>Select a different bird to continue.</p>
        <Button onClick={onNewGame}>
          Try again with {selectedBird}
        </Button>
      </div>
    </div>
  );
} 