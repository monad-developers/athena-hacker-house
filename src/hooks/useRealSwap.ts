'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWalletClient, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { createRealSwapService, RealSwapQuote, REAL_TOKENS } from '@/lib/realSwapService';
import toast from 'react-hot-toast';

export function useRealSwap() {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [isLoading, setIsLoading] = useState(false);
    const [quote, setQuote] = useState<RealSwapQuote | null>(null);
    const [swapService, setSwapService] = useState<ReturnType<typeof createRealSwapService> | null>(null);

    const { data: hash, error, isPending } = useSendTransaction();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Initialize swap service
    useEffect(() => {
        if (walletClient) {
            const provider = new ethers.BrowserProvider(walletClient);
            provider.getSigner().then((signer) => {
                const service = createRealSwapService(provider, signer);
                setSwapService(service);
            }).catch((error) => {
                console.error('Error creating swap service:', error);
            });
        }
    }, [walletClient]);

    const getSwapQuote = useCallback(async (
        inputAmount: string,
        inputToken: string = REAL_TOKENS.MON.address,
        outputToken: string = REAL_TOKENS.USDC.address
    ) => {
        if (!swapService || !address) {
            toast.error('Swap service not initialized');
            return null;
        }

        setIsLoading(true);
        try {
            const swapQuote = await swapService.getSwapQuote(
                inputAmount,
                inputToken,
                outputToken
            );

            setQuote(swapQuote);
            return swapQuote;
        } catch (error: unknown) {
            console.error('Error getting swap quote:', error);
            toast.error('Failed to get swap quote');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [swapService, address]);

    const executeSwap = useCallback(async (swapQuote: RealSwapQuote) => {
        if (!address || !swapService) {
            toast.error('Missing required data for swap');
            return false;
        }

        try {
            // For now, we'll simulate the swap with a real transaction
            // In production, this would call the actual DEX contract

            const txHash = await swapService.executeSwap(swapQuote, address);

            if (txHash) {
                toast.success('Swap transaction submitted!');
                return true;
            }

            return false;
        } catch (error: unknown) {
            console.error('Error executing swap:', error);
            toast.error('Failed to execute swap');
            return false;
        }
    }, [address, swapService]);

    // Handle transaction status
    useEffect(() => {
        if (isSuccess) {
            toast.success('Swap completed successfully!');
        }
    }, [isSuccess]);

    useEffect(() => {
        if (error) {
            toast.error('Swap transaction failed');
        }
    }, [error]);

    return {
        getSwapQuote,
        executeSwap,
        quote,
        isLoading,
        isPending,
        isConfirming,
        isSuccess,
        error,
        hash,
        swapService,
    };
}
