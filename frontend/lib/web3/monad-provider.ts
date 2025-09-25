import { createPublicClient, createWalletClient, http, PublicClient, WalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'

// Define Monad Testnet chain
export const monadTestnet = defineChain({
  id: 10143, // Updated Monad testnet chain ID (was 41454)
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: [process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet-explorer.monad.xyz',
    },
  },
  testnet: true,
})

// Create public client for reading blockchain data
export const publicClient: PublicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})

// Create wallet client for treasury operations
function createTreasuryWalletClient(): WalletClient | null {
  const privateKey = process.env.TREASURY_PRIVATE_KEY
  
  if (!privateKey) {
    console.warn('TREASURY_PRIVATE_KEY not found in environment variables')
    return null
  }

  if (!privateKey.startsWith('0x')) {
    console.error('TREASURY_PRIVATE_KEY must start with 0x')
    return null
  }

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    
    return createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(),
    })
  } catch (error) {
    console.error('Failed to create treasury wallet client:', error)
    return null
  }
}

export const treasuryWalletClient = createTreasuryWalletClient()

// Helper function to get treasury wallet address
export function getTreasuryAddress(): string | null {
  return treasuryWalletClient?.account?.address || null
}

// Helper function to check if Web3 is properly configured
export function isWeb3Configured(): boolean {
  return !!(
    process.env.MONAD_RPC_URL &&
    process.env.TREASURY_PRIVATE_KEY &&
    process.env.TOKEN_CONTRACT_ADDRESS &&
    treasuryWalletClient
  )
}

// Helper function to validate environment variables
export function validateWeb3Config(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!process.env.MONAD_RPC_URL) {
    errors.push('MONAD_RPC_URL is required')
  }

  if (!process.env.TREASURY_PRIVATE_KEY) {
    errors.push('TREASURY_PRIVATE_KEY is required')
  } else if (!process.env.TREASURY_PRIVATE_KEY.startsWith('0x')) {
    errors.push('TREASURY_PRIVATE_KEY must start with 0x')
  }

  if (!process.env.TOKEN_CONTRACT_ADDRESS) {
    errors.push('TOKEN_CONTRACT_ADDRESS is required')
  } else if (!process.env.TOKEN_CONTRACT_ADDRESS.startsWith('0x')) {
    errors.push('TOKEN_CONTRACT_ADDRESS must start with 0x')
  }

  if (!treasuryWalletClient) {
    errors.push('Failed to initialize treasury wallet client')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
