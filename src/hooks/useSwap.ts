'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { swapService, TOKENS } from '@/lib/swap';
import { SwapQuote } from '@/lib/swap';
import toast from 'react-hot-toast';

export function useSwap() {
    const { address } = useAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [quote, setQuote] = useState<SwapQuote | null>(null);

    const { sendTransaction, data: hash, error, isPending } = useSendTransaction();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const getSwapQuote = useCallback(async (
        sellAmount: string,
        sellToken: string = TOKENS.MON.address,
        buyToken: string = TOKENS.USDC.address
    ) => {
        if (!address) {
            toast.error('Please connect your wallet');
            return null;
        }

        setIsLoading(true);
        try {
            const sellAmountWei = ethers.parseEther(sellAmount).toString();
            const swapQuote = await swapService.getQuote(
                sellToken,
                buyToken,
                sellAmountWei,
                address,
                10143 // Monad testnet
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
    }, [address]);

    const executeSwap = useCallback(async (swapQuote: SwapQuote) => {
        if (!address) {
            toast.error('Please connect your wallet');
            return false;
        }

        try {
            await sendTransaction({
                to: swapQuote.to as `0x${string}`,
                data: swapQuote.data as `0x${string}`,
                value: BigInt(swapQuote.value),
                gas: BigInt(swapQuote.estimatedGas),
            });
            return true;
        } catch (error: unknown) {
            console.error('Error executing swap:', error);
            toast.error('Failed to execute swap');
            return false;
        }
    }, [address, sendTransaction]);

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
    };
}
