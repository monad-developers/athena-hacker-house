import React from 'react';
import { GAME_CONFIG } from '@/lib/constants';

type Vector2D = { x: number; y: number };

interface SlingshotProps {
  isDragging: boolean;
  dragEnd: Vector2D;
}

export function Slingshot({ isDragging, dragEnd }: SlingshotProps) {
  const trajectoryPoints = () => {
    if (!isDragging) return [];
    const points = [];
    let simPos = { ...GAME_CONFIG.slingshotPosition };
    const dx = GAME_CONFIG.slingshotPosition.x - dragEnd.x;
    const dy = GAME_CONFIG.slingshotPosition.y - dragEnd.y;
    let simVel = {
      x: dx * GAME_CONFIG.launchPower,
      y: dy * GAME_CONFIG.launchPower
    };

    for (let i = 0; i < 30; i++) {
      simVel.y += GAME_CONFIG.gravity;
      simPos.x += simVel.x;
      simPos.y += simVel.y;
      if (i % 2 === 0) points.push({ ...simPos });
    }
    return points;
  };

  return (
    <>
      {/* Slingshot base */}
      <div 
        className="absolute w-8 h-20 bg-yellow-900 rounded-md"
        style={{ 
          left: GAME_CONFIG.slingshotPosition.x - 20, 
          bottom: GAME_CONFIG.groundHeight - 20 
        }}
      />
      
      {/* Right arm */}
      <div 
        className="absolute w-2 h-20 bg-yellow-800 rounded-b-md"
        style={{ 
          left: GAME_CONFIG.slingshotPosition.x + 8, 
          bottom: GAME_CONFIG.groundHeight - 20, 
          transform: 'rotate(10deg)' 
        }}
      />
      
      {/* Left arm */}
      <div 
        className="absolute w-2 h-20 bg-yellow-800 rounded-b-md"
        style={{ 
          left: GAME_CONFIG.slingshotPosition.x - 10, 
          bottom: GAME_CONFIG.groundHeight - 20, 
          transform: 'rotate(-10deg)' 
        }}
      />

      {/* Trajectory dots */}
      {isDragging &&
        trajectoryPoints().map((p, i) => (
          <div
            key={i}
            className="absolute bg-white/50 rounded-full"
            style={{ left: p.x, top: p.y, width: 5, height: 5 }}
          />
        ))
      }
    </>
  );
} 