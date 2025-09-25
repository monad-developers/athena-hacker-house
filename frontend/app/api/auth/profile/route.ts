import { NextResponse } from 'next/server'
import { withAuth } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/prisma'

export const GET = withAuth(async (request, user) => {
  try {
    // Get detailed user profile
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
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

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get leaderboard position
    const leaderboardEntry = await prisma.leaderboardEntry.findUnique({
      where: { userId: user.id },
      select: {
        rank: true,
        rareQRsScanned: true,
        legendaryQRsScanned: true
      }
    })

    // Calculate phase progress
    const phaseProgress = await calculatePhaseProgress(user.id, userProfile.currentPhase)

    return NextResponse.json({
      success: true,
      profile: {
        ...userProfile,
        totalTokens: userProfile.totalTokens.toString(),
        scannedQRs: userProfile.scannedQRs.map(scan => ({
          ...scan,
          tokensEarned: scan.tokensEarned.toString()
        })),
        leaderboard: leaderboardEntry,
        phaseProgress
      }
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
})

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
