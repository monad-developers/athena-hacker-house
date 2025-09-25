import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GAME_CONFIG, SWAP_PAIRS, type Token } from '@/lib/constants';

type GameState = 'ready' | 'aiming' | 'flying' | 'hit' | 'miss' | 'swapping' | 'gameover';
type Vector2D = { x: number; y: number };

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

function generateTower(token: Token, index: number, gameAreaWidth: number): TowerStructure {
  const blocks: Block[] = [];
  // Use percentage-based positioning that scales with game area width
  const rightMargin = Math.max(200, gameAreaWidth * 0.15); // At least 200px from right edge
  const towerSpacing = Math.max(150, gameAreaWidth * 0.12); // At least 150px between towers
  const base_x = gameAreaWidth - rightMargin - (index * towerSpacing);
  const blockWidth = 40;
  const blockHeight = 20;
  const levels = Math.floor(Math.random() * 3) + 3;

  let blockCount = 0;
  for (let level = 0; level < levels; level++) {
    const numBlocks = Math.max(1, levels - level);
    const levelWidth = numBlocks * blockWidth;
    const startX = base_x + (GAME_CONFIG.towerWidth - levelWidth) / 2;
    for (let i = 0; i < numBlocks; i++) {
      blocks.push({
        id: `${token}-${blockCount++}`,
        x: startX + i * blockWidth,
        y: level * blockHeight,
        width: blockWidth,
        height: blockHeight,
        isHit: false,
      });
    }
  }

  // Add target block at the top
  const topY = levels * blockHeight;
  blocks.push({
    id: `${token}-target`,
    x: base_x + (GAME_CONFIG.towerWidth - 60) / 2,
    y: topY,
    width: 60,
    height: 60,
    isHit: false,
  });

  return { token, blocks };
}

interface UseGameLogicProps {
  selectedBird: Token;
  balances: Record<Token, number>;
  isConnected: boolean;
  handleSwap: (fromToken: Token, toToken: Token) => Promise<void>;
  refetchBalances?: () => Promise<void>;
}

export function useGameLogic({ selectedBird, balances, isConnected, handleSwap, refetchBalances }: UseGameLogicProps) {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [chances, setChances] = useState(3);
  const [towers, setTowers] = useState<TowerStructure[]>([]);
  const [hitTower, setHitTower] = useState<Token | null>(null);

  const [birdPosition, setBirdPosition] = useState<Vector2D>(GAME_CONFIG.slingshotPosition);
  const [birdVelocity, setBirdVelocity] = useState<Vector2D>({ x: 0, y: 0 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2D>({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState<Vector2D>(GAME_CONFIG.slingshotPosition);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const { toast } = useToast();
  
  const resetBird = useCallback(() => {
    setBirdPosition(GAME_CONFIG.slingshotPosition);
    setBirdVelocity({ x: 0, y: 0 });
    setGameState('ready');
    setHitTower(null);
  }, []);

  const setupTowers = useCallback(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;
    const width = gameArea.getBoundingClientRect().width;
    const possibleTargets = SWAP_PAIRS[selectedBird];
    console.log('🏰 Setting up towers', { width, possibleTargets, selectedBird });
    setTowers(possibleTargets.map((token, index) => generateTower(token, index, width)));
  }, [selectedBird]);

  const handleNewTurn = useCallback(() => {
    resetBird();
    setupTowers();
    setChances(3);
  }, [resetBird, setupTowers]);
  
  useEffect(() => {
    handleNewTurn();
  }, [selectedBird, handleNewTurn]);

  // Handle window resize to reposition towers
  useEffect(() => {
    const handleResize = () => {
      if (gameState === 'ready') {
        setupTowers();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupTowers, gameState]);
  
  // Auto-select a bird with balance if current bird has no balance
  useEffect(() => {
    if (isConnected && balances[selectedBird] <= 0) {
      const birdWithBalance = (Object.keys(balances) as Token[]).find(token => balances[token] > 0);
      if (birdWithBalance && birdWithBalance !== selectedBird) {
        toast({
          title: 'Bird Auto-Selected',
          description: `Switched to ${birdWithBalance} bird since it has balance.`,
        });
      }
    }
  }, [balances, selectedBird, isConnected, toast]);

  const gameLoop = useCallback(() => {
    if (gameState !== 'flying') return;

    setBirdPosition(prevPos => {
      const newPos = {
        x: prevPos.x + birdVelocity.x,
        y: prevPos.y + birdVelocity.y,
      };

      const gameArea = gameAreaRef.current?.getBoundingClientRect();
      if (!gameArea) return newPos;
      
      const groundY = gameArea.height - GAME_CONFIG.groundHeight;

      if (newPos.y > groundY - GAME_CONFIG.birdSize.height / 2 || newPos.y < 0) {
        setGameState('miss');
        return prevPos;
      }
      
      if (newPos.x < 0 || newPos.x > gameArea.width) {
        setGameState('miss');
        return prevPos;
      }

      let collision = false;
      setTowers(currentTowers => 
        currentTowers.map(tower => {
          const updatedBlocks = tower.blocks.map(block => {
            const blockBottomY = gameArea.height - (GAME_CONFIG.groundHeight + block.y);
            const blockTopY = gameArea.height - (GAME_CONFIG.groundHeight + block.y + block.height);
            
            if (!block.isHit && 
              newPos.x + GAME_CONFIG.birdSize.width / 2 > block.x && 
              newPos.x - GAME_CONFIG.birdSize.width / 2 < block.x + block.width &&
              newPos.y + GAME_CONFIG.birdSize.height / 2 > blockTopY && 
              newPos.y - GAME_CONFIG.birdSize.height / 2 < blockBottomY
            ) {
              collision = true;
              const isTarget = block.id.includes('target');
              
              console.log('🎯 TOWER BLOCK HIT!', {
                blockId: block.id,
                blockType: isTarget ? 'TARGET BLOCK' : 'TOWER BLOCK',
                tower: tower.token,
                birdToken: selectedBird,
                birdPos: { x: newPos.x, y: newPos.y },
                blockBounds: { 
                  x: { left: block.x, right: block.x + block.width },
                  y: { top: blockTopY, bottom: blockBottomY }
                },
                timestamp: new Date().toISOString(),
                willTriggerSwap: true
              });
              
              // ANY block hit in a tower triggers a swap with that tower's token
              console.log('🏰 TOWER HIT - TRIGGERING SWAP!', {
                towerToken: tower.token,
                willSwapFrom: selectedBird,
                willSwapTo: tower.token,
                hitBlockType: isTarget ? 'target' : 'regular',
                action: 'Setting hitTower state'
              });
              setHitTower(tower.token);
              
              return { ...block, isHit: true };
            }
            return block;
          });
          return { ...tower, blocks: updatedBlocks };
        })
      );
      
      if (collision) {
        console.log('💥 COLLISION DETECTED - Game state changing to HIT');
        setGameState('hit');
      }
      
      return newPos;
    });

    setBirdVelocity(prevVel => ({
      x: prevVel.x * 0.995,
      y: prevVel.y + GAME_CONFIG.gravity,
    }));

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, birdVelocity.x, birdVelocity.y, selectedBird]);

  useEffect(() => {
    if (gameState === 'flying') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gameLoop]);
  
  useEffect(() => {
    console.log('🎮 GAME STATE EFFECT TRIGGERED', {
      gameState,
      hitTower,
      selectedBird,
      chances,
      timestamp: new Date().toISOString()
    });
console.log('Current Towers State:', hitTower,gameState);

    if ( hitTower) {
      console.log('🔄 INITIATING SWAP SEQUENCE', {
        from: selectedBird,
        to: hitTower,
        action: 'About to call handleSwap',
        gameStateWillChangeTo: 'swapping'
      });
      setGameState('swapping');
      handleSwap(selectedBird, hitTower).then(async () => {
        console.log('✅ Swap completed, refreshing balances...');
        if (refetchBalances) {
          await refetchBalances();
        }
        setTimeout(() => {
          handleNewTurn();
        }, 1000);
      });
    } else if (gameState === 'miss' || (gameState === 'hit' && !hitTower)) {
        console.log('❌ MISS - NO TOWER HIT', {
          gameState,
          hitTower,
          chances,
          action: chances > 1 ? 'Reducing chances' : 'Game over',
          reason: gameState === 'miss' ? 'Bird missed all targets' : 'Hit registered but no tower token set'
        });
        if (chances > 1) {
            setChances(prev => prev - 1);
            setTimeout(() => {
                resetBird();
            }, 1500);
        } else {
            setGameState('gameover');
        }
    }
  }, [gameState, hitTower, selectedBird, chances, handleSwap, handleNewTurn, resetBird, refetchBalances]);

  return {
    gameState,
    setGameState,
    chances,
    towers,
    hitTower,
    birdPosition,
    birdVelocity,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    dragEnd,
    setDragEnd,
    gameAreaRef,
    setBirdVelocity,
    handleNewTurn,
    resetBird,
  };
} 