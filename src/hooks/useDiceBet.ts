'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { createContractInstance, Bet } from '@/lib/contract';
import toast from 'react-hot-toast';

export function useDiceBet() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [contract, setContract] = useState<ReturnType<typeof createContractInstance> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingBetId, setPendingBetId] = useState<number | null>(null);
    const [lastBet, setLastBet] = useState<Bet | null>(null);

    // Initialize contract
    useEffect(() => {
        if (isConnected && walletClient) {
            // Create provider and signer from walletClient
            const provider = new ethers.BrowserProvider(walletClient);
            provider.getSigner().then((signer) => {
                const contractInstance = createContractInstance(provider, signer);
                setContract(contractInstance);
            }).catch((error) => {
                console.error('Error creating signer:', error);
            });
        }
    }, [isConnected, walletClient]);

    // Check for pending bets
    useEffect(() => {
        const checkPendingBet = async () => {
            if (contract && address) {
                try {
                    const pendingId = await contract.getPendingBet(address);
                    setPendingBetId(pendingId > 0 ? pendingId : null);
                } catch (error) {
                    console.error('Error checking pending bet:', error);
                }
            }
        };

        checkPendingBet();
    }, [contract, address]);

    // Listen for contract events
    useEffect(() => {
        if (!contract) return;

        const handleBetPlaced = (betId: number, player: string) => {
            if (player.toLowerCase() === address?.toLowerCase()) {
                setPendingBetId(betId);
            }
        };

        const handleDiceRolled = (betId: number, player: string, choice: number, diceResult: number, isWinner: boolean) => {
            if (player.toLowerCase() === address?.toLowerCase()) {
                setPendingBetId(null);
                setLastBet({
                    player,
                    choice,
                    amount: '0.05',
                    timestamp: Date.now(),
                    isResolved: true,
                    isWinner,
                    diceResult,
                });
            }
        };

        const handlePayoutSent = (betId: number, player: string, amount: string, isWinner: boolean) => {
            if (player.toLowerCase() === address?.toLowerCase()) {
                if (isWinner) {
                    toast.success(`💰 Payout sent: ${amount} ETH`);
                }
            }
        };

        // Set up event listeners
        contract.onBetPlaced((betId: number, player: string) => {
            handleBetPlaced(betId, player);
        });
        contract.onDiceRolled(handleDiceRolled);
        contract.onPayoutSent(handlePayoutSent);

        // Cleanup
        return () => {
            contract.removeAllListeners();
        };
    }, [contract, address]);

    const placeBet = useCallback(async (choice: number, betAmount: string): Promise<boolean> => {
        if (!contract || !address) {
            toast.error('Contract not initialized or wallet not connected');
            return false;
        }

        if (pendingBetId) {
            toast.error('You already have a pending bet');
            return false;
        }

        setIsLoading(true);
        try {
            const tx = await contract.placeBet(choice, betAmount);
            toast.success('Transaction sent! Waiting for confirmation...');

            await tx.wait();
            toast.success('Bet placed successfully!');

            return true;
        } catch (error: unknown) {
            console.error('Error placing bet:', error);

            // Handle specific error cases
            const errorObj = error as { code?: string; message?: string };
            if (errorObj?.code === 'INSUFFICIENT_FUNDS') {
                toast.error('Insufficient funds for bet');
            } else if (errorObj?.code === 'USER_REJECTED') {
                toast.error('Transaction rejected by user');
            } else if (errorObj?.message?.includes('Bet amount too low')) {
                toast.error('Bet amount too low. Minimum is 0.001 ETH');
            } else if (errorObj?.message?.includes('Bet amount too high')) {
                toast.error('Bet amount too high. Maximum is 1.0 ETH');
            } else if (errorObj?.message?.includes('Choice must be between 1 and 6')) {
                toast.error('Please select a number between 1 and 6');
            } else {
                toast.error(errorObj?.message || 'Failed to place bet');
            }

            return false;
        } finally {
            setIsLoading(false);
        }
    }, [contract, address, pendingBetId]);

    const getBet = useCallback(async (betId: number): Promise<Bet | null> => {
        if (!contract) return null;

        try {
            const bet = await contract.getBet(betId);
            return bet;
        } catch (error) {
            console.error('Error getting bet:', error);
            return null;
        }
    }, [contract]);

    const getContractBalance = useCallback(async (): Promise<string> => {
        if (!contract) return '0';

        try {
            const balance = await contract.getContractBalance();
            return balance;
        } catch (error) {
            console.error('Error getting contract balance:', error);
            return '0';
        }
    }, [contract]);

    const getMinBetAmount = useCallback(async (): Promise<string> => {
        if (!contract) return '0.001';

        try {
            const minBetAmount = await contract.getMinBetAmount();
            return minBetAmount;
        } catch (error) {
            console.error('Error getting min bet amount:', error);
            return '0.001';
        }
    }, [contract]);

    const getMaxBetAmount = useCallback(async (): Promise<string> => {
        if (!contract) return '1.0';

        try {
            const maxBetAmount = await contract.getMaxBetAmount();
            return maxBetAmount;
        } catch (error) {
            console.error('Error getting max bet amount:', error);
            return '1.0';
        }
    }, [contract]);

    const resetGame = useCallback(() => {
        setLastBet(null);
        setPendingBetId(null);
        setIsLoading(false);
    }, []);

    return {
        contract,
        isLoading,
        pendingBetId,
        lastBet,
        placeBet,
        getBet,
        getContractBalance,
        getMinBetAmount,
        getMaxBetAmount,
        resetGame,
        isConnected,
        address,
    };
}
