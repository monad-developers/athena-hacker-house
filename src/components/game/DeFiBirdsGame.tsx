'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { type Token } from '@/lib/constants';

// Import custom hooks
import { useWallet } from '@/hooks/useWallet';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useGameControls } from '@/hooks/useGameControls';

// Import UI components
import { GameStatus } from './ui/GameStatus';
import { BirdSelection } from './ui/BirdSelection';
import { BalancePanel } from './ui/BalancePanel';
import { WalletConnectionOverlay } from './ui/WalletConnectionOverlay';
import { GameOverlay } from './ui/GameOverlay';

// Import game object components
import { Tower } from './objects/Tower';
import { Bird } from './objects/Bird';
import { Slingshot } from './objects/Slingshot';

export function DeFiBirdsGame() {
  const [selectedBird, setSelectedBird] = useState<Token>('MON');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio on component mount
  useEffect(() => {
    // Create audio element for tarzan call sound
    audioRef.current = new Audio('/call.mp3');
    audioRef.current.preload = 'auto'; 
    
    // Create background audio element
    backgroundAudioRef.current = new Audio('/angrybird.mp3');
    backgroundAudioRef.current.preload = 'auto';
    backgroundAudioRef.current.loop = true; 
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
    };
  }, []);

  // Initialize hooks
  const wallet = useWallet();
  
  // Debug wallet state in main component
  console.log('🎯 DeFiBirdsGame wallet state:', {
    isConnected: wallet.isConnected,
    address: wallet.address,
    chainId: wallet.chainId,
    hasBalances: Object.values(wallet.balances).some(b => b > 0),
    balances: wallet.balances
  });

  const gameLogic = useGameLogic({
    selectedBird,
    balances: wallet.balances,
    isConnected: wallet.isConnected,
    handleSwap: wallet.handleSwap,
    refetchBalances: wallet.refetchAllBalances,
  });
  
  const controls = useGameControls({
    gameState: gameLogic.gameState,
    setGameState: gameLogic.setGameState,
    isConnected: wallet.isConnected,
    selectedBird,
    balances: wallet.balances,
    isDragging: gameLogic.isDragging,
    setIsDragging: gameLogic.setIsDragging,
    setDragStart: gameLogic.setDragStart,
    setDragEnd: gameLogic.setDragEnd,
    dragEnd: gameLogic.dragEnd,
    setBirdVelocity: gameLogic.setBirdVelocity,
  });

  // Play/stop sound based on bird flying state
  useEffect(() => {
    if (gameLogic.gameState === 'flying' && audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to beginning
      audioRef.current.play().catch((error) => {
        console.log('Audio play failed:', error);
        // Audio autoplay might be blocked by browser, this is normal
      });
    } else if (audioRef.current && !audioRef.current.paused) {
      // Stop audio when bird stops flying
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset for next play
    }
  }, [gameLogic.gameState]);

  // Control background music based on wallet connection
  useEffect(() => {
    if (!wallet.isConnected && backgroundAudioRef.current) {
      // Play background music when wallet is not connected
      backgroundAudioRef.current.play().catch((error) => {
        console.log('Background audio play failed:', error);
        // Audio autoplay might be blocked by browser, this is normal
      });
    } else if (wallet.isConnected && backgroundAudioRef.current && !backgroundAudioRef.current.paused) {
      // Stop background music when wallet connects
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0; // Reset for next play
    }
  }, [wallet.isConnected]);

  // Auto-select a bird with balance if current bird has no balance
  useEffect(() => {
    console.log('🔄 Checking bird auto-selection:', { 
      selectedBird, 
      currentBalance: wallet.balances[selectedBird],
      allBalances: wallet.balances,
      isConnected: wallet.isConnected 
    });

    if (wallet.isConnected && wallet.balances[selectedBird] <= 0) {
      const birdWithBalance = (Object.keys(wallet.balances) as Token[]).find(token => wallet.balances[token] > 0);
      console.log('🐦 Looking for bird with balance:', { 
        found: birdWithBalance, 
        wouldChange: birdWithBalance && birdWithBalance !== selectedBird 
      });
      
      if (birdWithBalance && birdWithBalance !== selectedBird) {
        console.log('🔄 Auto-selecting bird:', birdWithBalance);
        setSelectedBird(birdWithBalance);
      }
    }
  }, [wallet.balances, selectedBird, wallet.isConnected]);

  return (
    <div
      ref={gameLogic.gameAreaRef}
      className="relative w-full h-[600px] sm:h-[700px] lg:h-[800px] max-w-6xl bg-transparent overflow-hidden select-none touch-none"
      onMouseDown={controls.handleMouseDown}
      onMouseMove={controls.handleMouseMove}
      onMouseUp={controls.handleMouseUp}
      onMouseLeave={controls.handleMouseUp}
      onTouchStart={controls.handleTouchStart}
      onTouchMove={controls.handleTouchMove}
      onTouchEnd={controls.handleTouchEnd}
      onTouchCancel={controls.handleTouchEnd}
      style={{ cursor: gameLogic.gameState === 'ready' && wallet.isConnected && wallet.balances[selectedBird] > 0 ? 'grab' : 'default' }}
    > 
      {/* Balance Panel */}
      <BalancePanel
        balances={wallet.balances}
        chances={gameLogic.chances}
        isConnected={wallet.isConnected}
        address={wallet.address}
        connectors={wallet.connectors}
        isConnecting={wallet.isConnecting}
        chainId={wallet.chainId}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
        onSwitchNetwork={wallet.switchToMonadTestnet}
      />
      
      {/* Bird Selection UI */}
      <BirdSelection
        selectedBird={selectedBird}
        onBirdSelect={setSelectedBird}
        balances={wallet.balances}
        onRefreshBalances={wallet.refetchAllBalances}
      />

      {/* Game Status UI */}
      <GameStatus
        chances={gameLogic.chances}
        gameState={gameLogic.gameState}
      />

      {/* Towers */}
      {gameLogic.towers.map(tower => (
        <Tower 
          key={tower.token}
          tower={tower}
          gameState={gameLogic.gameState}
          hitTower={gameLogic.hitTower}
        />
      ))}

      {/* Slingshot */}
      <Slingshot
        isDragging={gameLogic.isDragging}
        dragEnd={gameLogic.dragEnd}
      />

      {/* Bird */}
      <Bird
        selectedBird={selectedBird}
        gameState={gameLogic.gameState}
        birdPosition={gameLogic.birdPosition}
        birdVelocity={gameLogic.birdVelocity}
        dragEnd={gameLogic.dragEnd}
        chances={gameLogic.chances}
      />
      
      {/* Game Over Overlay */}
      <GameOverlay
        gameState={gameLogic.gameState}
        selectedBird={selectedBird}
        onNewGame={gameLogic.handleNewTurn}
      />

      {/* Wallet Connection Overlay */}
      <WalletConnectionOverlay
        isConnected={wallet.isConnected}
        connectors={wallet.connectors}
        isConnecting={wallet.isConnecting}
        onConnect={wallet.connect}
      />
    </div>
  );
} 