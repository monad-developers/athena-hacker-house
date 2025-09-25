import { writeContract, waitForTransactionReceipt, getAccount, readContract, estimateGas, sendTransaction } from '@wagmi/core';
import { parseUnits } from 'viem';
import { config } from '@/lib/wagmi';
import { SwapQuote, Token } from '@/types/swap';

// ERC-20 ABI for token approvals
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  }
] as const;

export interface SwapExecutionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface SwapExecutionProgress {
  step: 'approval' | 'swap' | 'complete';
  message: string;
  transactionHash?: string;
}

/**
 * Execute a token swap using the provided quote
 */
export async function executeSwap(
  quote: SwapQuote,
  fromToken: Token,
  onProgress?: (progress: SwapExecutionProgress) => void
): Promise<SwapExecutionResult> {
  try {
    const account = getAccount(config);
    
    if (!account.address) {
      throw new Error('Wallet not connected');
    }

    // Get the correct allowance target (from AllowanceHolder response)
    const allowanceTarget = quote.allowanceTarget || quote.issues?.allowance?.spender;
    
    if (!allowanceTarget) {
      throw new Error('No allowance target provided in quote');
    }

    // Step 1: Check if we need approval (for ERC-20 tokens)
    if (fromToken.address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      onProgress?.({
        step: 'approval',
        message: 'Checking token allowance...'
      });

      const sellAmount = parseUnits(quote.sellAmount, fromToken.decimals);
      
      // Check current allowance
      const allowance = await readContract(config, {
        address: fromToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [account.address, allowanceTarget as `0x${string}`],
      });

      // If allowance is insufficient, request approval
      if (allowance < sellAmount) {
        onProgress?.({
          step: 'approval',
          message: `Approving ${fromToken.symbol}...`
        });

        const approvalHash = await writeContract(config, {
          address: fromToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [allowanceTarget as `0x${string}`, sellAmount],
        });

        onProgress?.({
          step: 'approval',
          message: 'Waiting for approval confirmation...',
          transactionHash: approvalHash
        });

        // Wait for approval transaction to be confirmed
        await waitForTransactionReceipt(config, {
          hash: approvalHash,
        });
      }
    }

    // Step 2: Execute the swap
    onProgress?.({
      step: 'swap',
      message: 'Executing swap...'
    });

    const swapHash = await sendTransaction(config, {
      to: quote.to as `0x${string}`,
      data: quote.data as `0x${string}`,
      value: BigInt(quote.value || '0'),
    });

    onProgress?.({
      step: 'swap',
      message: 'Waiting for swap confirmation...',
      transactionHash: swapHash
    });

    // Wait for swap transaction to be confirmed
    const receipt = await waitForTransactionReceipt(config, {
      hash: swapHash,
    });

    onProgress?.({
      step: 'complete',
      message: 'Swap completed successfully!',
      transactionHash: swapHash
    });

    return {
      success: true,
      transactionHash: swapHash,
    };

  } catch (error) {
    console.error('Swap execution failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Estimate gas for a swap transaction
 */
export async function estimateSwapGas(quote: SwapQuote): Promise<bigint | null> {
  try {
    const account = getAccount(config);
    
    if (!account.address) {
      return null;
    }

    const gasEstimate = await estimateGas(config, {
      account: account.address,
      to: quote.to as `0x${string}`,
      data: quote.data as `0x${string}`,
      value: BigInt(quote.value || '0'),
    });

    return gasEstimate;
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return null;
  }
}

/**
 * Check if user has sufficient balance for the swap
 */
export function checkSufficientBalance(
  balance: { value: bigint } | undefined,
  amount: string,
  decimals: number
): boolean {
  if (!balance) return false;
  
  const requiredAmount = parseUnits(amount, decimals);
  return balance.value >= requiredAmount;
}

/**
 * Format transaction hash for display
 */
export function formatTransactionHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Get block explorer URL for transaction
 */
export function getTransactionUrl(hash: string, chainId: number): string {
  const explorers: Record<number, string> = {
    10143: 'https://testnet.monad.xyz/tx/',
    8453: 'https://basescan.org/tx/',
  };
  
  const baseUrl = explorers[chainId] || 'https://testnet.monad.xyz/tx/';
  return `${baseUrl}${hash}`;
}