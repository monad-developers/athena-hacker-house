import { verifyMessage } from 'viem'
import { prisma } from './prisma'
import { AuthenticationError, ValidationError } from './errors'

export interface AuthResult {
  isValid: boolean
  user?: {
    id: string
    walletAddress: string
    nickname: string
    totalTokens: string
    qrCodesScanned: number
  }
  error?: string
}

// Generate a message for wallet signature
export function generateAuthMessage(walletAddress: string, timestamp?: number): string {
  const ts = timestamp || Date.now()
  return `Welcome to Token Crunchies!\n\nSign this message to authenticate your wallet.\n\nWallet: ${walletAddress}\nTimestamp: ${ts}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`
}

// Verify wallet signature and authenticate user
export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!walletAddress || !signature || !message) {
      return {
        isValid: false,
        error: 'Missing required authentication parameters'
      }
    }

    // Verify the signature
    const isValidSignature = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`
    })

    if (!isValidSignature) {
      return {
        isValid: false,
        error: 'Invalid signature'
      }
    }

    // Check if message is recent (within 5 minutes)
    const timestampMatch = message.match(/Timestamp: (\d+)/)
    if (timestampMatch) {
      const messageTimestamp = parseInt(timestampMatch[1])
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000

      if (now - messageTimestamp > fiveMinutes) {
        return {
          isValid: false,
          error: 'Authentication message has expired'
        }
      }
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    })

    if (!user) {
      // Create new user with temporary nickname
      const tempNickname = `player_${walletAddress.slice(-6)}`
      
      user = await prisma.user.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          nickname: tempNickname
        }
      })
    }

    return {
      isValid: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        nickname: user.nickname,
        totalTokens: user.totalTokens.toString(),
        qrCodesScanned: user.qrCodesScanned
      }
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return {
      isValid: false,
      error: 'Authentication failed'
    }
  }
}

// Create or update user with custom nickname
export async function createOrUpdateUser(
  walletAddress: string,
  nickname?: string
) {
  try {
    const normalizedAddress = walletAddress.toLowerCase()

    // Check if nickname is already taken (if provided)
    if (nickname) {
      const existingUser = await prisma.user.findFirst({
        where: {
          nickname,
          walletAddress: { not: normalizedAddress }
        }
      })

      if (existingUser) {
        throw new ValidationError('Nickname is already taken')
      }
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { walletAddress: normalizedAddress },
      update: nickname ? { nickname } : {},
      create: {
        walletAddress: normalizedAddress,
        nickname: nickname || `player_${walletAddress.slice(-6)}`
      }
    })

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      nickname: user.nickname,
      totalTokens: user.totalTokens.toString(),
      qrCodesScanned: user.qrCodesScanned,
      lastScannedAt: user.lastScannedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    
    console.error('User creation/update error:', error)
    throw new Error('Failed to create or update user')
  }
}

// Get user by wallet address
export async function getUserByWallet(walletAddress: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      include: {
        scannedQRs: {
          include: {
            qrCode: true
          },
          orderBy: {
            scannedAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      throw new AuthenticationError('User not found')
    }

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      nickname: user.nickname,
      totalTokens: user.totalTokens.toString(),
      qrCodesScanned: user.qrCodesScanned,
      lastScannedAt: user.lastScannedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      scannedQRs: user.scannedQRs.map(scan => ({
        id: scan.id,
        tokensEarned: scan.tokensEarned.toString(),
        scannedAt: scan.scannedAt,
        transactionHash: scan.transactionHash,
        transferStatus: scan.transferStatus,
        qrCode: {
          id: scan.qrCode.id,
          name: scan.qrCode.name,
          rarity: scan.qrCode.rarity,
          tokenReward: scan.qrCode.tokenReward.toString()
        }
      }))
    }

  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error
    }
    
    console.error('Get user error:', error)
    throw new Error('Failed to get user')
  }
}

// Middleware function to extract and verify wallet from request
export async function authenticateRequest(
  walletAddress?: string,
  signature?: string,
  message?: string
): Promise<AuthResult> {
  if (!walletAddress || !signature || !message) {
    return {
      isValid: false,
      error: 'Missing authentication headers'
    }
  }

  return await verifyWalletSignature(walletAddress, signature, message)
}
