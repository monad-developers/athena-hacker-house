import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { TOKENS, GAME_CONFIG, type Token } from '@/lib/constants';

type Block = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isHit: boolean;
};

type TowerStructure = {
  token: Token;
  blocks: Block[];
};

interface TowerProps {
  tower: TowerStructure;
  gameState: 'ready' | 'aiming' | 'flying' | 'hit' | 'miss' | 'swapping' | 'gameover';
  hitTower: Token | null;
}

export function Tower({ tower, gameState, hitTower }: TowerProps) {
  return (
    <>
      {tower.blocks.map(block => {
        const isTargetBlock = block.id.includes('target');
        const isSwapping = gameState === 'swapping' && hitTower === tower.token;
        
        return (
          <motion.div
            key={block.id}
            initial={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            animate={{
              opacity: block.isHit ? 0 : 1,
              scale: block.isHit ? 0.2 : 1,
              rotate: block.isHit ? (Math.random() - 0.5) * 180 : 0,
              y: block.isHit ? 100 : 0,
            }}
            transition={{ duration: 0.4, type: 'spring' }}
            className="absolute"
            style={{
              width: block.width,
              height: block.height,
              left: block.x,
              bottom: GAME_CONFIG.groundHeight + block.y,
            }}
          >
            {isTargetBlock ? (
              <div className="relative w-full h-full bg-yellow-900/50 rounded-md flex flex-col items-center justify-between p-2 border-2 border-yellow-400">
                <AnimatePresence>
                  {isSwapping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md z-10"
                    >
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <h3 className="text-xl font-bold text-white">{tower.token}</h3>
                {React.createElement(TOKENS[tower.token].icon, { className: 'w-10 h-10' })}
                <ArrowLeftRight className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="w-full h-full bg-yellow-900/80 rounded-sm border border-yellow-700 hover:bg-yellow-800/90 transition-colors" title={`Hit any block to swap for ${tower.token}`} />
            )}
          </motion.div>
        );
      })}
    </>
  );
} 