import React from 'react';

interface GameStatusProps {
  chances: number;
  gameState: 'ready' | 'aiming' | 'flying' | 'hit' | 'miss' | 'swapping' | 'gameover';
}

export function GameStatus({ chances, gameState }: GameStatusProps) {
  const getStatusMessage = () => {
    switch (gameState) {
      case 'ready':
        return (
          <div>
            <div className="sm:hidden">Touch and drag to hit towers!</div>
            <div className="hidden sm:block">Aim at towers to swap!</div>
          </div>
        );
      case 'aiming':
        return (
          <div>
            <div className="sm:hidden">Drag to aim at towers...</div>
            <div className="hidden sm:block">Pull to aim at towers...</div>
          </div>
        );
      case 'flying':
        return 'Bird in flight!';
      case 'swapping':
        return 'Swapping tokens...';
      case 'hit':
        return 'Tower hit! Swapping...';
      case 'miss':
        return 'Missed towers! Try again!';
      default:
        return '';
    }
  };

  return (
    <div 
      className="absolute top-2 right-2 sm:top-4 sm:right-4 p-3 bg-white/90 rounded-xl shadow-lg backdrop-blur-sm z-30 text-sm sm:text-base"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="text-sm font-semibold text-gray-700 mb-1">
        Chances: {chances}
      </div>
      <div className="text-xs text-gray-600">
        {getStatusMessage()}
      </div>
    </div>
  );
} 