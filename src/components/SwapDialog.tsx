'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { X, ArrowRightLeft, Loader2 } from 'lucide-react';
import { ethers } from 'ethers';
import { priceService, PriceData } from '@/lib/priceService';
import { REAL_TOKENS } from '@/lib/realSwapService';
import { useRealSwap } from '@/hooks/useRealSwap';
import toast from 'react-hot-toast';

interface SwapDialogProps {
    isOpen: boolean;
    onClose: () => void;
    winningAmount: string; // ETH amount won
    onSwapComplete: () => void;
}

export function SwapDialog({ isOpen, onClose, winningAmount, onSwapComplete }: SwapDialogProps) {
    const { address } = useAccount();
    const [priceData, setPriceData] = useState<PriceData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getSwapQuote, executeSwap, isPending, isConfirming } = useRealSwap();

    const fetchSwapPrice = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Validate winning amount
            if (!winningAmount || parseFloat(winningAmount) <= 0) {
                throw new Error('Invalid winning amount');
            }

            // Convert the winning amount (bet amount) to wei for the API call
            const sellAmountWei = ethers.parseEther(winningAmount).toString();

            console.log('Fetching price for winning amount:', {
                winningAmount,
                sellAmountWei
            });

            const price = await priceService.getPrice(sellAmountWei);

            // Validate price data
            if (!price || price.buyAmount === '0') {
                throw new Error('Invalid price data received');
            }

            console.log('Price data received:', price);
            setPriceData(price);

            // Show success message based on source
            if (price.source === 'mock') {
                toast.success('Using demo pricing for hackathon showcase!');
            } else {
                toast.success(`Price fetched from ${price.source.toUpperCase()}`);
            }
        } catch (error: unknown) {
            console.error('Error fetching swap price:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch swap price. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [winningAmount]);

    // Fetch swap price when dialog opens
    useEffect(() => {
        if (isOpen && winningAmount && address) {
            fetchSwapPrice();
        }
    }, [isOpen, winningAmount, address, fetchSwapPrice]);

    const handleSwap = async () => {
        if (!address || !priceData) {
            toast.error('Missing required data for swap');
            return;
        }

        try {
            // Validate price data
            if (!priceData.buyAmount || priceData.buyAmount === '0') {
                throw new Error('Invalid swap amount');
            }

            // Get swap quote for the actual transaction
            const swapQuote = await getSwapQuote(
                winningAmount,
                REAL_TOKENS.MON.address,
                REAL_TOKENS.USDC.address
            );

            if (!swapQuote) {
                throw new Error('Failed to get swap quote');
            }

            // Execute the actual swap
            const success = await executeSwap(swapQuote);

            if (success) {
                const usdcAmount = priceService.formatTokenAmount(priceData.buyAmount, REAL_TOKENS.USDC.decimals);
                toast.success(`Swapped ${winningAmount} MON to ${usdcAmount} USDC!`);

                // Wait for transaction confirmation
                setTimeout(() => {
                    onSwapComplete();
                    onClose();
                }, 2000);
            }

        } catch (error: unknown) {
            console.error('Error executing swap:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to execute swap';
            toast.error(errorMessage);
        }
    };

    const handleKeepMon = async () => {
        try {
            // When user chooses to keep MON, they get double their bet amount
            const doubleAmount = (parseFloat(winningAmount) * 2).toFixed(4);
            toast.success(`You received ${doubleAmount} MON (double your bet amount)!`);

            // Simulate transaction delay
            setTimeout(() => {
                onSwapComplete();
                onClose();
            }, 1500);
        } catch (error: unknown) {
            console.error('Error keeping MON:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to process MON payout';
            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowRightLeft className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Congratulations!</h2>
                    <p className="text-gray-600">You won {winningAmount} MON! Convert to USDC?</p>
                </div>

                {/* Swap Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{winningAmount}</div>
                            <div className="text-sm text-gray-500">MON</div>
                        </div>

                        <div className="flex items-center justify-center">
                            <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                        </div>

                        <div className="text-center">
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : priceData ? (
                                <>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {priceService.formatTokenAmount(priceData.buyAmount, 6)}
                                    </div>
                                    <div className="text-sm text-gray-500">USDC</div>
                                    <div className="text-xs text-blue-500 mt-1">
                                        via {priceData.source.toUpperCase()}
                                    </div>
                                </>
                            ) : (
                                <div className="text-2xl font-bold text-gray-400">--</div>
                            )}
                        </div>
                    </div>

                    {priceData && (
                        <div className="text-center text-sm text-gray-500">
                            Rate: 1 MON = {parseFloat(priceData.price).toFixed(4)} USDC
                        </div>
                    )}

                    {error && (
                        <div className="text-center text-sm text-red-500 mt-2">
                            {error}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleKeepMon}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Keep MON
                    </button>

                    <button
                        onClick={handleSwap}
                        disabled={isLoading || !priceData || !!error || isPending || isConfirming}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading || isPending || isConfirming ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Loading...'}
                            </>
                        ) : (
                            'Swap to USDC'
                        )}
                    </button>
                </div>

                {/* Info */}
                <div className="mt-4 text-xs text-gray-500 text-center">
                    {priceData?.source === 'real' ? 'Real-time pricing • Live swap' :
                        priceData?.source === 'market' ? 'Market pricing • Live swap' :
                            'Live swap • Gas fees apply'}
                </div>
            </div>
        </div>
    );
}
