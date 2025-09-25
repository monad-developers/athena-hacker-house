import { NextRequest, NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { prisma } from '../prisma'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    walletAddress: string
    nickname: string
    currentPhase: string
  }
}

export interface AuthError {
  error: string
  code: 'MISSING_AUTH' | 'INVALID_SIGNATURE' | 'EXPIRED_MESSAGE' | 'USER_NOT_FOUND' | 'INVALID_ADDRESS'
}

// Simplified message format for better wallet compatibility
export const createAuthMessage = (address: string, timestamp: number): string => {
  return `Welcome to Token Crunchies!\n\nSign this message to authenticate your wallet.\n\nWallet: ${address}\nTime: ${new Date(timestamp).toISOString()}\n\nThis request will not trigger any blockchain transaction or cost any gas fees.`
}

// Verify wallet signature and authenticate user
export async function verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Verify the signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`
    })

    if (!isValid) {
      return { isValid: false, error: 'Invalid signature' }
    }

    // Check message timestamp (should be within 5 minutes)
    const timestampMatch = message.match(/Time: (.+)/)
    if (!timestampMatch) {
      return { isValid: false, error: 'Invalid message format' }
    }

    const messageTimestamp = new Date(timestampMatch[1]).getTime()
    const currentTimestamp = Date.now()
    const fiveMinutes = 5 * 60 * 1000

    if (currentTimestamp - messageTimestamp > fiveMinutes) {
      return { isValid: false, error: 'Message expired' }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Signature verification error:', error)
    return { isValid: false, error: 'Verification failed' }
  }
}

// Authentication middleware for API routes
export async function authenticateUser(request: NextRequest): Promise<{
  success: boolean
  user?: {
    id: string
    walletAddress: string
    nickname: string
    currentPhase: string
  }
  error?: AuthError
}> {
  try {
    // Get authentication headers
    const walletAddress = request.headers.get('x-wallet-address')
    const signature = request.headers.get('x-wallet-signature')
    const encodedMessage = request.headers.get('x-auth-message')

    // Check for simplified authentication (wallet address only)
    if (walletAddress && !signature && !encodedMessage) {
      // Simplified authentication - just check if user exists with this wallet
      if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        return {
          success: false,
          error: {
            error: 'Invalid wallet address format',
            code: 'INVALID_ADDRESS'
          }
        }
      }

      // Find user by wallet address
      const user = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
        select: {
          id: true,
          walletAddress: true,
          nickname: true,
          currentPhase: true
        }
      })

      if (!user) {
        return {
          success: false,
          error: {
            error: 'User not found. Please register first.',
            code: 'USER_NOT_FOUND'
          }
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          nickname: user.nickname,
          currentPhase: user.currentPhase
        }
      }
    }

    // Legacy signature-based authentication (fallback)
    const message = encodedMessage ? decodeURIComponent(encodedMessage) : null

    if (!walletAddress || !signature || !message) {
      return {
        success: false,
        error: {
          error: 'Missing authentication headers',
          code: 'MISSING_AUTH'
        }
      }
    }

    // Validate wallet address format
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return {
        success: false,
        error: {
          error: 'Invalid wallet address format',
          code: 'INVALID_ADDRESS'
        }
      }
    }

    // Verify signature
    const signatureResult = await verifyWalletSignature(walletAddress, message, signature)
    
    if (!signatureResult.isValid) {
      return {
        success: false,
        error: {
          error: signatureResult.error || 'Invalid signature',
          code: signatureResult.error?.includes('expired') ? 'EXPIRED_MESSAGE' : 'INVALID_SIGNATURE'
        }
      }
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: {
        id: true,
        walletAddress: true,
        nickname: true,
        currentPhase: true
      }
    })

    if (!user) {
      return {
        success: false,
        error: {
          error: 'User not found. Please register first.',
          code: 'USER_NOT_FOUND'
        }
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        nickname: user.nickname,
        currentPhase: user.currentPhase
      }
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: {
        error: 'Authentication failed',
        code: 'INVALID_SIGNATURE'
      }
    }
  }
}

// Helper function to create authentication error response
export function createAuthErrorResponse(error: AuthError, status: number = 401): NextResponse {
  return NextResponse.json(error, { status })
}

// Middleware wrapper for API routes
export function withAuth(
  handler: (request: AuthenticatedRequest, user: NonNullable<AuthenticatedRequest['user']>) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticateUser(request)
    
    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult.error!, 401)
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = authResult.user

    return handler(authenticatedRequest, authResult.user)
  }
}

// Rate limiting helper (simple in-memory store for now)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    // Reset or create new entry
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }
  
  current.count++
  rateLimitStore.set(key, current)
  
  return { allowed: true, remaining: maxRequests - current.count, resetTime: current.resetTime }
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute
