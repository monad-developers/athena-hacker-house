import { formatEther, parseEther, parseUnits, formatUnits } from 'viem'
import { publicClient, treasuryWalletClient, getTreasuryAddress, monadTestnet } from './monad-provider'
import { TokenTransferError, Web3Error } from '../errors'

// ERC-20 ABI for token transfers
const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export interface TokenTransferResult {
  success: boolean
  transactionHash?: string
  error?: string
  gasUsed?: string
}

export interface TreasuryBalance {
  nativeBalance: string // ETH/MON balance for gas
  tokenBalance: string // Token balance
  nativeBalanceFormatted: string
  tokenBalanceFormatted: string
}

// Get treasury wallet balances
export async function getTreasuryBalance(): Promise<TreasuryBalance> {
  const treasuryAddress = getTreasuryAddress()
  
  if (!treasuryAddress) {
    throw new Web3Error('Treasury wallet not configured')
  }

  const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS as `0x${string}`
  
  if (!tokenContractAddress) {
    throw new Web3Error('Token contract address not configured')
  }

  try {
    // Get native balance (MON for gas)
    const nativeBalance = await publicClient.getBalance({
      address: treasuryAddress as `0x${string}`
    })

    // Get token balance
    const tokenBalance = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [treasuryAddress as `0x${string}`]
    })

    // Get token decimals
    const tokenDecimals = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: 'decimals'
    })

    return {
      nativeBalance: nativeBalance.toString(),
      tokenBalance: tokenBalance.toString(),
      nativeBalanceFormatted: formatEther(nativeBalance),
      tokenBalanceFormatted: formatUnits(tokenBalance, tokenDecimals)
    }
  } catch (error) {
    console.error('Error getting treasury balance:', error)
    throw new Web3Error(`Failed to get treasury balance: ${error}`)
  }
}

// Transfer tokens from treasury to user wallet
export async function transferTokensToUser(
  userAddress: string,
  amount: string
): Promise<TokenTransferResult> {
  if (!treasuryWalletClient || !treasuryWalletClient.account) {
    return {
      success: false,
      error: 'Treasury wallet client not initialized - check TREASURY_PRIVATE_KEY environment variable'
    }
  }

  const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS as `0x${string}`
  
  if (!tokenContractAddress) {
    return {
      success: false,
      error: 'Token contract address not configured - check TOKEN_CONTRACT_ADDRESS environment variable'
    }
  }

  try {
    // Validate user address
    if (!userAddress.startsWith('0x') || userAddress.length !== 42) {
      return {
        success: false,
        error: 'Invalid user address format'
      }
    }

    // Get token decimals
    const tokenDecimals = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: 'decimals'
    })

    // Convert amount to proper units
    const amountInUnits = parseUnits(amount, tokenDecimals)

    // Check treasury token balance
    const balance = await getTreasuryBalance()
    const currentTokenBalance = BigInt(balance.tokenBalance)

    if (currentTokenBalance < amountInUnits) {
      return {
        success: false,
        error: `Insufficient token balance. Required: ${amount}, Available: ${balance.tokenBalanceFormatted}`
      }
    }

    // Check native balance for gas
    const minGasBalance = parseEther(process.env.TREASURY_MIN_BALANCE || '0.1')
    const currentNativeBalance = BigInt(balance.nativeBalance)

    if (currentNativeBalance < minGasBalance) {
      return {
        success: false,
        error: `Insufficient native balance for gas. Current: ${balance.nativeBalanceFormatted} MON`
      }
    }

    // Execute token transfer
    const hash = await treasuryWalletClient.writeContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [userAddress as `0x${string}`, amountInUnits],
      account: treasuryWalletClient.account,
      chain: monadTestnet
    })

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1
    })

    if (receipt.status === 'success') {
      return {
        success: true,
        transactionHash: hash,
        gasUsed: receipt.gasUsed.toString()
      }
    } else {
      return {
        success: false,
        error: 'Transaction failed on blockchain'
      }
    }

  } catch (error) {
    console.error('Token transfer error:', error)
    
    if (error instanceof TokenTransferError || error instanceof Web3Error) {
      throw error
    }

    return {
      success: false,
      error: `Transfer failed: ${error}`
    }
  }
}

// Check if treasury has sufficient balance for a transfer
export async function checkSufficientBalance(tokenAmount: string): Promise<boolean> {
  try {
    const balance = await getTreasuryBalance()
    const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS as `0x${string}`

    // Get token decimals
    const tokenDecimals = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: 'decimals'
    })

    const requiredAmount = parseUnits(tokenAmount, tokenDecimals)
    const currentBalance = BigInt(balance.tokenBalance)

    return currentBalance >= requiredAmount
  } catch (error) {
    console.error('Error checking balance:', error)
    return false
  }
}

// Get estimated gas cost for a token transfer
export async function estimateTransferGas(userAddress: string, amount: string): Promise<bigint> {
  if (!treasuryWalletClient || !treasuryWalletClient.account) {
    throw new Web3Error('Treasury wallet client not initialized')
  }

  const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS as `0x${string}`

  try {
    const tokenDecimals = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: 'decimals'
    })

    const amountInUnits = parseUnits(amount, tokenDecimals)

    const gasEstimate = await publicClient.estimateContractGas({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [userAddress as `0x${string}`, amountInUnits],
      account: treasuryWalletClient.account
    })

    return gasEstimate
  } catch (error) {
    console.error('Gas estimation error:', error)
    throw new Web3Error(`Failed to estimate gas: ${error}`)
  }
}
