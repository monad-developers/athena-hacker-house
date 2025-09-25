import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GAME_CONFIG, type Token } from '@/lib/constants';

type GameState = 'ready' | 'aiming' | 'flying' | 'hit' | 'miss' | 'swapping' | 'gameover';
type Vector2D = { x: number; y: number };

interface UseGameControlsProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  isConnected: boolean;
  selectedBird: Token;
  balances: Record<Token, number>;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  setDragStart: (pos: Vector2D) => void;
  setDragEnd: (pos: Vector2D) => void;
  dragEnd: Vector2D;
  setBirdVelocity: (velocity: Vector2D) => void;
}

export function useGameControls({
  gameState,
  setGameState,
  isConnected,
  selectedBird,
  balances,
  isDragging,
  setIsDragging,
  setDragStart,
  setDragEnd,
  dragEnd,
  setBirdVelocity,
}: UseGameControlsProps) {
  const { toast } = useToast();

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Don't interfere with button clicks or UI elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.bird-selection-ui')) {
      return;
    }
    
    if (gameState !== 'ready' || !isConnected) return;
    
    // Check if the selected bird has balance before allowing gameplay
    const currentBalance = balances[selectedBird];
    if (currentBalance <= 0) {
      toast({ 
        title: 'No Balance', 
        description: `You need some ${selectedBird} tokens to play with this bird.`, 
        variant: 'destructive' 
      });
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const distFromSlingshot = Math.sqrt(
      (x - GAME_CONFIG.slingshotPosition.x)**2 + (y - GAME_CONFIG.slingshotPosition.y)**2
    );

    if (distFromSlingshot > GAME_CONFIG.birdSize.width) return;

    setGameState('aiming');
    setIsDragging(true);
    setDragStart({ x, y });
    setDragEnd(GAME_CONFIG.slingshotPosition);
  }, [gameState, isConnected, balances, selectedBird, toast, setGameState, setIsDragging, setDragStart, setDragEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Don't interfere with button clicks or UI elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.bird-selection-ui')) {
      return;
    }
    
    // Removed e.preventDefault() to avoid passive event listener error
    if (gameState !== 'ready' || !isConnected) return;
    
    // Check if the selected bird has balance before allowing gameplay
    const currentBalance = balances[selectedBird];
    if (currentBalance <= 0) {
      toast({ 
        title: 'No Balance', 
        description: `You need some ${selectedBird} tokens to play with this bird.`, 
        variant: 'destructive' 
      });
      return;
    }
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const distFromSlingshot = Math.sqrt(
      (x - GAME_CONFIG.slingshotPosition.x)**2 + (y - GAME_CONFIG.slingshotPosition.y)**2
    );

    if (distFromSlingshot > GAME_CONFIG.birdSize.width) return;

    setGameState('aiming');
    setIsDragging(true);
    setDragStart({ x, y });
    setDragEnd(GAME_CONFIG.slingshotPosition);
  }, [gameState, isConnected, balances, selectedBird, toast, setGameState, setIsDragging, setDragStart, setDragEnd]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    const dx = currentPos.x - GAME_CONFIG.slingshotPosition.x;
    const dy = currentPos.y - GAME_CONFIG.slingshotPosition.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    dist = Math.min(dist, GAME_CONFIG.maxDragDistance);
    const angle = Math.atan2(dy, dx);
    
    setDragEnd({
        x: GAME_CONFIG.slingshotPosition.x + Math.cos(angle) * dist,
        y: GAME_CONFIG.slingshotPosition.y + Math.sin(angle) * dist,
    });
  }, [isDragging, setDragEnd]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Removed e.preventDefault() to avoid passive event listener error
    if (!isDragging) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const currentPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    
    const dx = currentPos.x - GAME_CONFIG.slingshotPosition.x;
    const dy = currentPos.y - GAME_CONFIG.slingshotPosition.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    dist = Math.min(dist, GAME_CONFIG.maxDragDistance);
    const angle = Math.atan2(dy, dx);
    
    setDragEnd({
        x: GAME_CONFIG.slingshotPosition.x + Math.cos(angle) * dist,
        y: GAME_CONFIG.slingshotPosition.y + Math.sin(angle) * dist,
    });
  }, [isDragging, setDragEnd]);

  const handleMouseUp = useCallback(() => {
    
    if (!isDragging) return;
    setIsDragging(false);
    
    const dx = GAME_CONFIG.slingshotPosition.x - dragEnd.x;
    const dy = GAME_CONFIG.slingshotPosition.y - dragEnd.y;

    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        setGameState('ready');
        return;
    }

    setGameState('flying');
    
    setBirdVelocity({
        x: dx * GAME_CONFIG.launchPower,
        y: dy * GAME_CONFIG.launchPower,
    });
  }, [isDragging, setIsDragging, dragEnd, setGameState, setBirdVelocity]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) return;
    setIsDragging(false);
    
    const dx = GAME_CONFIG.slingshotPosition.x - dragEnd.x;
    const dy = GAME_CONFIG.slingshotPosition.y - dragEnd.y;

    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        setGameState('ready');
        return;
    }

    setGameState('flying');
    
    setBirdVelocity({
        x: dx * GAME_CONFIG.launchPower,
        y: dy * GAME_CONFIG.launchPower,
    });
  }, [isDragging, setIsDragging, dragEnd, setGameState, setBirdVelocity]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
} 