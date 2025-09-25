import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { verifyWalletSignature, checkRateLimit } from '../../../../lib/middleware/auth'

// Phase progress calculation function (shared with profile route)
async function calculatePhaseProgress(userId: string, currentPhase: string) {
  // Get total QRs in current phase
  const totalQRsInPhase = await prisma.qRCode.count({
    where: {
      phase: currentPhase as 'PHASE_1' | 'PHASE_2' | 'PHASE_3',
      isActive: true
    }
  })

  // Get scanned QRs in current phase
  const scannedQRsInPhase = await prisma.userQRScan.count({
    where: {
      userId,
      qrCode: {
        phase: currentPhase as 'PHASE_1' | 'PHASE_2' | 'PHASE_3',
        isActive: true
      }
    }
  })

  // Get next required QR (lowest sequence order not yet scanned)
  const nextQR = await prisma.qRCode.findFirst({
    where: {
      phase: currentPhase as 'PHASE_1' | 'PHASE_2' | 'PHASE_3',
      isActive: true,
      scannedBy: {
        none: {
          userId
        }
      }
    },
    orderBy: {
      sequenceOrder: 'asc'
    },
    select: {
      id: true,
      name: true,
      sequenceOrder: true,
      rarity: true,
      hint: {
        select: {
          title: true,
          content: true
        }
      }
    }
  })

  return {
    currentPhase,
    totalQRs: totalQRsInPhase,
    scannedQRs: scannedQRsInPhase,
    progress: totalQRsInPhase > 0 ? (scannedQRsInPhase / totalQRsInPhase) * 100 : 0,
    nextQR,
    isPhaseComplete: scannedQRsInPhase >= totalQRsInPhase
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = checkRateLimit(`register:${clientIP}`, 5, 300000) // 5 requests per 5 minutes
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { walletAddress, nickname, signature, message } = body

    // Validate required fields - support both simplified and signature-based registration
    if (!walletAddress || !nickname) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, nickname' },
        { status: 400 }
      )
    }

    // Validate wallet address format
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Validate nickname
    if (nickname.length < 3 || nickname.length > 20) {
      return NextResponse.json(
        { error: 'Nickname must be between 3 and 20 characters' },
        { status: 400 }
      )
    }

    // Check for invalid characters in nickname
    if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
      return NextResponse.json(
        { error: 'Nickname can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
    }

    // Optional signature verification (for backward compatibility)
    if (signature && message) {
      const signatureResult = await verifyWalletSignature(walletAddress, message, signature)
      
      if (!signatureResult.isValid) {
        return NextResponse.json(
          { error: signatureResult.error || 'Invalid signature' },
          { status: 401 }
        )
      }
    }
    // If no signature provided, proceed with simplified registration (wallet address only)

    // Check if wallet address already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Wallet address already registered' },
        { status: 409 }
      )
    }

    // Check if nickname already exists
    const existingNickname = await prisma.user.findUnique({
      where: { nickname }
    })

    if (existingNickname) {
      return NextResponse.json(
        { error: 'Nickname already taken' },
        { status: 409 }
      )
    }

    // Create new user with complete profile data
    const user = await prisma.user.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
        nickname,
        totalTokens: 0,
        qrCodesScanned: 0
      },
      select: {
        id: true,
        walletAddress: true,
        nickname: true,
        totalTokens: true,
        qrCodesScanned: true,
        currentPhase: true,
        lastScannedAt: true,
        createdAt: true,
        scannedQRs: {
          select: {
            id: true,
            tokensEarned: true,
            scannedAt: true,
            transactionHash: true,
            transferStatus: true,
            qrCode: {
              select: {
                name: true,
                rarity: true,
                phase: true,
                sequenceOrder: true
              }
            }
          },
          orderBy: {
            scannedAt: 'desc'
          }
        }
      }
    })

    // Create initial leaderboard entry
    const leaderboardEntry = await prisma.leaderboardEntry.create({
      data: {
        userId: user.id,
        nickname: user.nickname,
        totalTokens: 0,
        qrCodesScanned: 0,
        rareQRsScanned: 0,
        legendaryQRsScanned: 0
      },
      select: {
        rank: true,
        rareQRsScanned: true,
        legendaryQRsScanned: true
      }
    })

    // Calculate phase progress for new user
    const phaseProgress = await calculatePhaseProgress(user.id, user.currentPhase)

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        totalTokens: user.totalTokens.toString(),
        scannedQRs: user.scannedQRs.map(scan => ({
          ...scan,
          tokensEarned: scan.tokensEarned.toString()
        })),
        leaderboard: leaderboardEntry,
        phaseProgress
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
