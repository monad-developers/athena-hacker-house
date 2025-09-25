'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance, useWriteContract, useSendTransaction } from 'wagmi';
import { MONAD_TESTNET_CONFIG, TESTNET_TOKENS } from '@/lib/config';
import { swapAuthManager, SwapAuthorization } from '@/lib/swapAuthorization';
import { parseEther, formatEther } from 'viem';
import { ethers } from 'ethers';
import { toast } from 'sonner';

interface UseRainbowKitReturn {
  account: {
    address: string;
    balance: string;
    chainId: number;
  } | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  switchToMonadTestnet: () => Promise<void>;
  sendTransaction: (transaction: unknown) => Promise<string>;
  requestSwapAuthorization: () => Promise<SwapAuthorization>;
  isAuthorizedForSwaps: boolean;
  authorizationStatus: SwapAuthorization | null;
  wrapMonad: (amount: string) => Promise<string>;
  getWMONBalance: () => Promise<string>;
}

export function useRainbowKit(): UseRainbowKitReturn {
  const [error, setError] = useState<string | null>(null);
  const [isAuthorizedForSwaps, setIsAuthorizedForSwaps] = useState(false);
  const [authorizationStatus, setAuthorizationStatus] = useState<SwapAuthorization | null>(null);

  // Wagmi hooks
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  // Account data
  const account = address ? {
    address,
    balance: balance ? formatEther(balance.value) : '0',
    chainId: chainId || 0,
  } : null;

  // const isOnMonadTestnet = chainId === MONAD_TESTNET_CONFIG.chainId;

  const checkAuthorizationStatus = useCallback(async () => {
    if (!address) return;

    try {
      const isAuthorized = swapAuthManager.isAuthorized(address);
      const auth = swapAuthManager.getAuthorization(address);
      setIsAuthorizedForSwaps(isAuthorized);
      setAuthorizationStatus(auth);
    } catch (error) {
      console.error('Failed to check authorization status:', error);
    }
  }, [address]);

  // Check authorization status when account changes
  useEffect(() => {
    if (address && isConnected) {
      checkAuthorizationStatus();
    } else {
      setIsAuthorizedForSwaps(false);
      setAuthorizationStatus(null);
    }
  }, [address, isConnected, checkAuthorizationStatus]);

  const connectWallet = useCallback(() => {
    try {
      setError(null);
      // Use the first available connector (usually MetaMask)
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      } else {
        setError('No wallet connectors available');
      }
    } catch (err: unknown) {
      console.error('Connection failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to connect: ${errorMessage}`);
    }
  }, [connect, connectors]);

  const disconnectWallet = useCallback(() => {
    try {
      if (address) {
        swapAuthManager.clearAllAuthorizations();
      }
      disconnect();
      setIsAuthorizedForSwaps(false);
      setAuthorizationStatus(null);
      setError(null);
    } catch (err: unknown) {
      console.error('Disconnect failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to disconnect: ${errorMessage}`);
    }
  }, [disconnect, address]);

  const switchToMonadTestnet = useCallback(async () => {
    try {
      await switchChain({ chainId: MONAD_TESTNET_CONFIG.chainId });
      toast.success('Switched to Monad Testnet', {
        description: 'Ready for automatic swaps',
        duration: 3000,
      });
    } catch (err: unknown) {
      console.error('Failed to switch chain:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to switch to Monad testnet: ${errorMessage}`);
      toast.error(`Network switch failed: ${errorMessage}`, {
        duration: 5000,
      });
    }
  }, [switchChain]);

  const sendTransaction = useCallback(async (transaction: unknown): Promise<string> => {
    if (!address) throw new Error('No account connected');

    // Type guard for transaction object
    if (!transaction || typeof transaction !== 'object') {
      throw new Error('Invalid transaction object');
    }

    const tx = transaction as {
      to?: string;
      value?: string;
      data?: string;
      gas?: string;
      gasLimit?: string;
      gasPrice?: string;
    };

    // CRITICAL FIX: Validate transaction has required 'to' field
    if (!tx.to) {
      throw new Error('Transaction is missing required "to" address field');
    }

    if (tx.to === '0x' || tx.to === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Invalid "to" address: ${tx.to}`);
    }

    try {
      console.log('📤 Sending transaction:', {
        to: tx.to,
        from: address,
        value: tx.value || '0',
        gasLimit: tx.gasLimit || tx.gas,
        gasPrice: tx.gasPrice,
        data: tx.data?.slice(0, 20) + '...' // Log first 20 chars of data
      });

      // Use wagmi's sendTransaction for raw transactions
      // Estimate gas if not provided or use a safe default
      const gasLimit = tx.gas ? BigInt(tx.gas) : BigInt('500000'); // Increased gas limit for complex swaps
      const gasPrice = tx.gasPrice ? BigInt(tx.gasPrice) : BigInt(ethers.parseUnits('1', 'gwei')); // Increased gas price for better execution

      const txHash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : undefined,
        gas: gasLimit,
        gasPrice: gasPrice,
      });

      console.log('✅ Transaction sent successfully:', txHash);
      return txHash;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Transaction failed with details:', {
        error: errorMessage,
        to: tx.to,
        from: address,
        value: tx.value || '0',
        gasLimit: tx.gasLimit || tx.gas,
        gasPrice: tx.gasPrice
      });

      // Log specific error types
      if (errorMessage.includes('Internal JSON-RPC error')) {
        console.error('🔴 This is likely due to insufficient balance, missing approvals, or network issues on Monad testnet');
      }

      throw error;
    }
  }, [address, sendTransactionAsync]);

  const requestSwapAuthorization = useCallback(async (): Promise<SwapAuthorization> => {
    if (!address || typeof window.ethereum === 'undefined') {
      throw new Error('No wallet connected');
    }

    setError(null);

    try {
      console.log('🔐 Starting dual signing process: wallet connection + ERC-20 approval...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const authorization = await swapAuthManager.requestSwapAuthorization(address, provider);

      // Update authorization status
      await checkAuthorizationStatus();

      console.log('🎉 Dual signing completed! Ready for automatic swaps.');
      toast.success('Authorization completed!', {
        description: 'Ready for automatic angle-based swaps',
        duration: 4000,
      });
      return authorization;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Authorization request failed:', error);
      setError(errorMessage);
      toast.error(`Authorization failed: ${errorMessage}`, {
        duration: 5000,
      });
      throw error;
    }
  }, [address, checkAuthorizationStatus]);

  const wrapMonad = useCallback(async (amount: string): Promise<string> => {
    if (!address) throw new Error('No account connected');

    try {
      console.log(`🔄 Wrapping ${amount} MON to WMON...`);

      // WrappedMonad contract ABI for deposit function
      const wmonAbi = [
        {
          name: 'deposit',
          type: 'function',
          stateMutability: 'payable',
          inputs: [],
          outputs: []
        }
      ] as const;

      // Call deposit function on WMON contract, sending MON as value
      const txHash = await writeContractAsync({
        address: TESTNET_TOKENS.MONAD as `0x${string}`,
        abi: wmonAbi,
        functionName: 'deposit',
        args: [],
        value: parseEther(amount), // Send MON as native currency
      });

      console.log('✅ Wrapping transaction sent:', txHash);
      return txHash;

    } catch (error: unknown) {
      console.error('❌ Wrapping failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to wrap MON: ${errorMessage}`);
    }
  }, [address, writeContractAsync]);

  const getWMONBalance = useCallback(async (): Promise<string> => {
    if (!address || typeof window === 'undefined') return '0';

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const wmonContract = new ethers.Contract(
        TESTNET_TOKENS.MONAD,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );

      const balance = await wmonContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.warn('Failed to get WMON balance:', error);
      return '0';
    }
  }, [address]);

  return {
    account,
    isConnected,
    isConnecting,
    error,
    connect: connectWallet,
    disconnect: disconnectWallet,
    switchToMonadTestnet,
    sendTransaction,
    requestSwapAuthorization,
    isAuthorizedForSwaps,
    authorizationStatus,
    wrapMonad,
    getWMONBalance,
  };
}
