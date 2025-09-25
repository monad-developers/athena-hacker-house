import { NextResponse } from 'next/server'
import { withAuth } from '../../../../../lib/middleware/auth'
import { prisma } from '../../../../../lib/prisma'

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('scanId')

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      )
    }

    // Get the scan record
    const scanRecord = await prisma.userQRScan.findUnique({
      where: { 
        id: scanId,
        userId: user.id // Ensure user can only check their own scans
      },
      include: {
        qrCode: {
          select: {
            name: true,
            rarity: true,
            sequenceOrder: true
          }
        }
      }
    })

    if (!scanRecord) {
      return NextResponse.json(
        { error: 'Scan record not found' },
        { status: 404 }
      )
    }

    // Return status with appropriate message
    const statusMessages = {
      PENDING: {
        status: 'pending',
        message: 'Preparing your token transfer...',
        description: 'Setting up the blockchain transaction'
      },
      PROCESSING: {
        status: 'processing',
        message: 'Confirming your transaction...',
        description: 'Your tokens are being transferred on the blockchain'
      },
      CONFIRMED: {
        status: 'success',
        message: 'Tokens received successfully!',
        description: `You earned ${scanRecord.tokensEarned} tokens`
      },
      FAILED: {
        status: 'failed',
        message: 'Transfer failed',
        description: 'Please try scanning the QR code again'
      }
    }

    const statusInfo = statusMessages[scanRecord.transferStatus] || {
      status: 'unknown',
      message: 'Unknown status',
      description: 'Please refresh and try again'
    }

    return NextResponse.json({
      scanId: scanRecord.id,
      transferStatus: scanRecord.transferStatus,
      transactionHash: scanRecord.transactionHash,
      tokensEarned: scanRecord.tokensEarned.toString(),
      scannedAt: scanRecord.scannedAt,
      transferredAt: scanRecord.transferredAt,
      qrCode: {
        name: scanRecord.qrCode.name,
        rarity: scanRecord.qrCode.rarity,
        sequenceOrder: scanRecord.qrCode.sequenceOrder
      },
      ...statusInfo
    })

  } catch (error) {
    console.error('Scan status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check scan status' },
      { status: 500 }
    )
  }
})
