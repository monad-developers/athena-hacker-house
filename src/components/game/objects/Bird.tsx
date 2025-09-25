import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonBirdIcon, UsdcBirdIcon, WethBirdIcon } from '@/lib/icons';
import { GAME_CONFIG, type Token } from '@/lib/constants';

const BIRD_ICONS: Record<Token, React.FC<any>> = {
  USDC: UsdcBirdIcon,
  MON: MonBirdIcon,
  WETH: WethBirdIcon,
};

type GameState = 'ready' | 'aiming' | 'flying' | 'hit' | 'miss' | 'swapping' | 'gameover';
type Vector2D = { x: number; y: number };

interface BirdProps {
  selectedBird: Token;
  gameState: GameState;
  birdPosition: Vector2D;
  birdVelocity: Vector2D;
  dragEnd: Vector2D;
  chances: number;
}

export function Bird({ selectedBird, gameState, birdPosition, birdVelocity, dragEnd, chances }: BirdProps) {
  const BirdIcon = BIRD_ICONS[selectedBird];

  return (
    <>
      {/* Bird in ready/aiming state */}
      <AnimatePresence>
        {gameState !== 'flying' && gameState !== 'hit' && gameState !== 'swapping' && (
          <motion.div 
            key={`${selectedBird}-${chances}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            style={{ 
              position: 'absolute', 
              left: dragEnd.x - GAME_CONFIG.birdSize.width/2, 
              top: dragEnd.y - GAME_CONFIG.birdSize.height/5, 
              pointerEvents: 'none' 
            }}
          >
            <BirdIcon className="w-12 h-12" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bird in flying state */}
      {gameState === 'flying' && (
        <div 
          style={{ 
            position: 'absolute', 
            transform: `translate(${birdPosition.x - GAME_CONFIG.birdSize.width/2}px, ${birdPosition.y - GAME_CONFIG.birdSize.height/2}px) rotate(${birdVelocity.y * 2}deg)`, 
            transformOrigin: 'center', 
            pointerEvents: 'none' 
          }}
        >
          <BirdIcon className="w-12 h-12" />
        </div>
      )}
    </>
  );
} 