import { NextResponse } from 'next/server'
import { withAuth } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/prisma'

export const GET = withAuth(async (request, user) => {
  try {
    // Get all user's scanned QR IDs
    const userScans = await prisma.userQRScan.findMany({
      where: {
        userId: user.id
      },
      select: {
        qrCodeId: true
      }
    })

    const scannedQRIds = userScans.map(scan => scan.qrCodeId)

    // Get all active QR codes with hints
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        sequenceOrder: true,
        rarity: true,
        tokenReward: true,
        hint: {
          select: {
            title: true,
            content: true
          }
        }
      },
      orderBy: {
        sequenceOrder: 'asc'
      }
    })

    // Determine which hints to show based on sequential scanning rules
    const hintsToShow = qrCodes.map(qr => {
      const isScanned = scannedQRIds.includes(qr.id)
      const shouldShowHint = determineHintVisibility(qr, isScanned, scannedQRIds.length)

      return {
        id: qr.id,
        name: qr.name,
        sequenceOrder: qr.sequenceOrder,
        rarity: qr.rarity,
        tokenReward: qr.tokenReward.toString(),
        isScanned,
        hint: shouldShowHint && qr.hint ? {
          title: qr.hint.title,
          content: qr.hint.content
        } : null,
        hintAvailable: !!qr.hint,
        hintLocked: !shouldShowHint
      }
    })

    // Get overall progress
    const totalQRs = qrCodes.length
    const scannedQRs = scannedQRIds.length

    return NextResponse.json({
      success: true,
      hints: hintsToShow,
      progress: {
        total: totalQRs,
        scanned: scannedQRs,
        percentage: totalQRs > 0 ? (scannedQRs / totalQRs) * 100 : 0
      }
    })

  } catch (error) {
    console.error('Hints fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hints' },
      { status: 500 }
    )
  }
})

/**
 * Function for determining visibility 
 * @param qr 
 * @param isScanned 
 * @param totalScanned 
 * @returns 
 */
function determineHintVisibility(
  qr: { sequenceOrder: number },
  isScanned: boolean,
  totalScanned: number
): boolean {
  // Always show hints for already scanned QRs
  if (isScanned) {
    return true
  }

  // Show hint for next QR in sequence (sequential scanning)
  // Users can see hints for the next unscanned QR in order
  return qr.sequenceOrder === totalScanned + 1
}

// Get specific hint by QR ID (for authenticated users)
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json()
    const { qrId } = body

    if (!qrId) {
      return NextResponse.json(
        { error: 'QR ID is required' },
        { status: 400 }
      )
    }

    // Get QR code with hint
    const qrCode = await prisma.qRCode.findUnique({
      where: {
        id: qrId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        sequenceOrder: true,
        rarity: true,
        tokenReward: true,
        hint: {
          select: {
            title: true,
            content: true
          }
        }
      }
    })

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code not found' },
        { status: 404 }
      )
    }

    // Check if user has already scanned this QR
    const existingScan = await prisma.userQRScan.findUnique({
      where: {
        userId_qrCodeId: {
          userId: user.id,
          qrCodeId: qrCode.id
        }
      }
    })

    const isScanned = !!existingScan

    // Get user's total scanned QRs
    const totalScanned = await prisma.userQRScan.count({
      where: {
        userId: user.id
      }
    })

    const shouldShowHint = determineHintVisibility(qrCode, isScanned, totalScanned)

    if (!shouldShowHint) {
      return NextResponse.json(
        { error: 'Hint not available yet' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        name: qrCode.name,
        sequenceOrder: qrCode.sequenceOrder,
        rarity: qrCode.rarity,
        tokenReward: qrCode.tokenReward.toString(),
        isScanned,
        hint: qrCode.hint
      }
    })

  } catch (error) {
    console.error('Specific hint fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hint' },
      { status: 500 }
    )
  }
})