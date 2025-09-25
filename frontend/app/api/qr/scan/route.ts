// TODO: Database is not getting updated after successfull run 

import { NextResponse } from 'next/server'
import { withAuth, checkRateLimit } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/prisma'
import { transferTokensToUser } from '../../../../lib/web3/treasury-wallet'
import { extractQRMetadata } from '../../../../lib/qr-generator'
import { isWeb3Configured, getTreasuryAddress } from '../../../../lib/web3/monad-provider'

// Helper function to convert numbers to ordinals (1st, 2nd, 3rd, etc.)
function getOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const remainder = num % 100
  return num + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0])
}

export const POST = withAuth(async (request, user) => {
  try {
    // Rate limiting per user
    const rateLimit = checkRateLimit(`scan:${user.id}`, 20, 60000) // 20 scans per minute
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many scan attempts. Please wait before scanning again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { qrCode } = body

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      )
    }

    // Extract metadata from the scanned QR code
    console.log('Scanned QR code:', qrCode)
    const qrMetadata = extractQRMetadata(qrCode)
    
    if (!qrMetadata) {
      console.log('Failed to extract metadata from QR code:', qrCode)
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      )
    }

    console.log('Extracted QR metadata:', {
      code: qrMetadata.code,
      note: 'All metadata (name, phase, rarity, reward, sequence) will be looked up from database - QR contains only random ID'
    })

    // Find the QR code in database using the extracted code
    const qrCodeRecord = await prisma.qRCode.findUnique({
      where: { 
        code: qrMetadata.code,
        isActive: true
      },
      include: {
        hint: true
      }
    })

    if (!qrCodeRecord) {
      console.log('QR code not found in database:', qrMetadata.code)
      return NextResponse.json(
        { error: 'Invalid or inactive QR code' },
        { status: 404 }
      )
    }

    console.log('Found QR code in database:', {
      id: qrCodeRecord.id,
      name: qrCodeRecord.name,
      code: qrCodeRecord.code,
      phase: qrCodeRecord.phase,
      sequence: qrCodeRecord.sequenceOrder,
      isActive: qrCodeRecord.isActive
    })

    // No client-side validation needed - QR only contains random ID
    // All validation is done server-side for maximum security
    console.log('QR validation: Using database record for all metadata')

    // Check if user already scanned this QR code
    console.log('Checking for existing scan:', { userId: user.id, qrCodeId: qrCodeRecord.id })
    const existingScan = await prisma.userQRScan.findUnique({
      where: {
        userId_qrCodeId: {
          userId: user.id,
          qrCodeId: qrCodeRecord.id
        }
      }
    })
    console.log('Existing scan check result:', existingScan ? { 
      id: existingScan.id, 
      status: existingScan.transferStatus,
      scannedAt: existingScan.scannedAt 
    } : 'No existing scan found')

    if (existingScan) {
      // Check if the existing scan was successful or failed
      if (existingScan.transferStatus === 'CONFIRMED') {
        return NextResponse.json({
          success: false,
          error: 'QR code already successfully scanned',
          message: 'You have already successfully scanned this QR code and received your tokens.',
          scan: {
            id: existingScan.id,
            tokensEarned: existingScan.tokensEarned.toString(),
            scannedAt: existingScan.scannedAt,
            transactionHash: existingScan.transactionHash
          }
        }, { status: 409 })
      } else if (existingScan.transferStatus === 'FAILED') {
        // Allow retry for failed transfers by deleting the failed record
        console.log('Previous scan failed, allowing retry by deleting failed record:', existingScan.id)
        await prisma.userQRScan.delete({
          where: { id: existingScan.id }
        })
        console.log('Deleted failed scan record, proceeding with new attempt')
      } else if (existingScan.transferStatus === 'PENDING') {
        // Check if the pending transfer is stuck (older than 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        if (existingScan.scannedAt < fiveMinutesAgo) {
          console.log('Pending transfer is stuck, cleaning up and allowing retry:', existingScan.id)
          await prisma.userQRScan.update({
            where: { id: existingScan.id },
            data: { transferStatus: 'FAILED' }
          })
          return NextResponse.json({
            success: false,
            error: 'Previous transfer timed out',
            message: 'Your previous scan attempt timed out. Please try scanning the QR code again.',
            details: {
              reason: 'Transfer took too long to complete',
              suggestion: 'Scan the QR code again to retry the token transfer.'
            }
          }, { status: 408 }) // Request Timeout
        } else {
          return NextResponse.json({
            success: false,
            error: 'QR code scan in progress',
            message: 'This QR code scan is currently being processed. Please wait a moment before trying again.',
            details: {
              reason: 'Transfer still pending',
              suggestion: 'Wait a few seconds and try again if the transfer is taking too long.'
            }
          }, { status: 429 }) // Too Many Requests
        }
      }
    }

    // Get user's current progress including current phase
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        qrCodesScanned: true,
        currentPhase: true,
        scannedQRs: {
          where: {
            userId: user.id,
            transferStatus: 'CONFIRMED' // Only count successfully transferred scans
          },
          orderBy: {
            qrCode: {
              sequenceOrder: 'asc'
            }
          },
          select: {
            qrCode: {
              select: {
                sequenceOrder: true,
                phase: true
              }
            }
          }
        }
      }
    })

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate sequential scanning - users must scan QR codes in order within their current phase
    // Check if the QR code belongs to the user's current phase
    if (qrCodeRecord.phase !== userRecord.currentPhase) {
      const phaseNames = {
        'PHASE_1': 'Phase 1: Campus Hunt',
        'PHASE_2': 'Phase 2: Rare Treasures', 
        'PHASE_3': 'Phase 3: Legendary Quest'
      }
      
      return NextResponse.json(
        { 
          error: `This QR code belongs to ${phaseNames[qrCodeRecord.phase as keyof typeof phaseNames]}. You are currently in ${phaseNames[userRecord.currentPhase as keyof typeof phaseNames]}.`,
          currentPhase: userRecord.currentPhase,
          qrPhase: qrCodeRecord.phase,
          hint: 'Complete your current phase first to unlock the next phase!'
        },
        { status: 400 }
      )
    }

    // Get the last scanned sequence in the current phase
    const scannedInCurrentPhase = userRecord.scannedQRs.filter(
      scan => scan.qrCode.phase === userRecord.currentPhase
    )
    const expectedSequence = scannedInCurrentPhase.length > 0 
      ? Math.max(...scannedInCurrentPhase.map(scan => scan.qrCode.sequenceOrder)) + 1
      : (userRecord.currentPhase === 'PHASE_1' ? 1 : 
         userRecord.currentPhase === 'PHASE_2' ? 9 : 13) // Starting sequence for each phase
    
    console.log('Sequential validation:', {
      userScannedCount: userRecord.scannedQRs.length,
      expectedSequence,
      receivedSequence: qrCodeRecord.sequenceOrder,
      qrCodeName: qrCodeRecord.name
    })
    
    if (qrCodeRecord.sequenceOrder !== expectedSequence) {
      console.log(`Sequential scan validation failed: Expected ${expectedSequence}, got ${qrCodeRecord.sequenceOrder}`)
      return NextResponse.json(
        { 
          error: `Please scan QR codes in order. You need to find the ${expectedSequence === 1 ? 'first' : getOrdinal(expectedSequence)} QR code first.`,
          expectedSequence,
          receivedSequence: qrCodeRecord.sequenceOrder,
          hint: expectedSequence === 1 ? 'Start with the first QR code!' : `You need to find the ${getOrdinal(expectedSequence)} QR code next.`
        },
        { status: 400 }
      )
    }

    // Pre-validate Web3 configuration before creating scan record
    if (!isWeb3Configured()) {
      console.log('Web3 not configured, rejecting scan')
      return NextResponse.json({
        success: false,
        error: 'Token transfer system not available',
        message: 'The token distribution system is currently unavailable. Please try again later.',
        details: {
          reason: 'Web3 configuration incomplete',
          suggestion: 'Please contact support if this issue persists.'
        }
      }, { status: 503 }) // Service Unavailable
    }

    const treasuryAddress = getTreasuryAddress()
    if (!treasuryAddress) {
      console.log('Treasury wallet not available, rejecting scan')
      return NextResponse.json({
        success: false,
        error: 'Treasury wallet not available',
        message: 'The token distribution wallet is not accessible. Please try again later.',
        details: {
          reason: 'Treasury wallet initialization failed',
          suggestion: 'Please contact support if this issue persists.'
        }
      }, { status: 503 })
    }

    // Create scan record with pending transfer status
    let scanRecord
    try {
      scanRecord = await prisma.userQRScan.create({
        data: {
          userId: user.id,
          qrCodeId: qrCodeRecord.id,
          tokensEarned: qrCodeRecord.tokenReward,
          transferStatus: 'PENDING'
        }
      })
    } catch (error: unknown) {
      // Handle unique constraint violation (race condition)
      const prismaError = error as { code?: string; meta?: { target?: string[] } }
      if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('userId_qrCodeId')) {
        console.log('Race condition detected: QR code already scanned by this user')
        
        // Re-check for existing scan record
        const existingScan = await prisma.userQRScan.findUnique({
          where: {
            userId_qrCodeId: {
              userId: user.id,
              qrCodeId: qrCodeRecord.id
            }
          }
        })
        
        if (existingScan?.transferStatus === 'CONFIRMED') {
          // Fetch updated user stats
          const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              totalTokens: true,
              qrCodesScanned: true
            }
          })
          
          // Scan was successful - return success response
          return NextResponse.json({
            success: true,
            message: 'QR code successfully scanned',
            scan: {
              id: existingScan.id,
              qrCode: {
                id: qrCodeRecord.id,
                name: qrCodeRecord.name,
                code: qrCodeRecord.code,
                rarity: qrCodeRecord.rarity,
                phase: qrCodeRecord.phase,
                description: qrCodeRecord.hint?.content || null
              },
              tokensEarned: existingScan.tokensEarned.toString(),
              scannedAt: existingScan.scannedAt,
              transactionHash: existingScan.transactionHash,
              transferStatus: existingScan.transferStatus
            },
            userStats: {
              totalTokens: updatedUser?.totalTokens.toString() || '0',
              qrCodesScanned: updatedUser?.qrCodesScanned || 0
            }
          }, { status: 200 })
        } else {
          return NextResponse.json({
            success: false,
            error: 'QR code scan already in progress',
            message: 'This QR code is already being processed. Please wait a moment.',
            details: {
              reason: 'Concurrent scan attempt detected',
              suggestion: 'Please wait and try again if needed.'
            }
          }, { status: 429 })
        }
      }
      
      // Re-throw other database errors
      console.error('Database error during scan record creation:', error)
      throw error
    }

    // Initiate token transfer
    let transferResult
    try {
      console.log('Initiating token transfer:', {
        userAddress: user.walletAddress,
        amount: qrCodeRecord.tokenReward.toString(),
        qrCode: qrCodeRecord.code
      })

      transferResult = await transferTokensToUser(
        user.walletAddress,
        qrCodeRecord.tokenReward.toString()
      )

      console.log('Token transfer result:', transferResult)

      // Update scan record with transfer result
      await prisma.userQRScan.update({
        where: { id: scanRecord.id },
        data: {
          transactionHash: transferResult.transactionHash,
          transferStatus: transferResult.success ? 'CONFIRMED' : 'FAILED',
          transferredAt: transferResult.success ? new Date() : null,
          gasUsed: transferResult.gasUsed
        }
      })

      console.log('Updated scan record with transfer status:', transferResult.success ? 'CONFIRMED' : 'FAILED')

    } catch (error) {
      console.error('Token transfer error:', error)
      
      // Update scan record as failed
      await prisma.userQRScan.update({
        where: { id: scanRecord.id },
        data: {
          transferStatus: 'FAILED'
        }
      })

      transferResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed'
      }
    }

    // Update user stats if transfer was successful
    if (transferResult.success) {
      console.log('Transfer successful, updating user stats...')
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          totalTokens: {
            increment: qrCodeRecord.tokenReward
          },
          qrCodesScanned: {
            increment: 1
          },
          lastScannedAt: new Date()
        }
      })

      console.log('Updated user stats:', {
        userId: user.id,
        newTotalTokens: updatedUser.totalTokens.toString(),
        newQrCodesScanned: updatedUser.qrCodesScanned
      })

      // Update leaderboard
      await updateLeaderboard(user.id, qrCodeRecord.rarity)
      console.log('Updated leaderboard for user:', user.id)

      // Check for phase advancement
      const phaseAdvancement = await checkPhaseAdvancement(user.id, updatedUser.qrCodesScanned)
      console.log('Phase advancement check:', phaseAdvancement)

      // Create swap opportunity (NEW: 1 swap per successful scan)
      let swapOpportunity = null
      try {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
        const opportunity = await prisma.swapOpportunity.create({
          data: {
            userId: user.id,
            qrScanId: scanRecord.id,
            expiresAt: expiresAt
          }
        })

        swapOpportunity = {
          id: opportunity.id,
          expiresAt: opportunity.expiresAt,
          available: true,
          message: '🎉 You earned a swap opportunity! Trade WMON ↔ USDT'
        }

        console.log('Created swap opportunity for user:', user.id, opportunity.id)
      } catch (error) {
        console.error('Failed to create swap opportunity:', error)
        // Don't fail the scan if swap opportunity creation fails
      }

      return NextResponse.json({
        success: true,
        scan: {
          id: scanRecord.id,
          tokensEarned: qrCodeRecord.tokenReward.toString(),
          transactionHash: transferResult.transactionHash,
          qrCode: {
            name: qrCodeRecord.name,
            rarity: qrCodeRecord.rarity,
            sequenceOrder: qrCodeRecord.sequenceOrder
          }
        },
        phaseAdvancement: phaseAdvancement.advanced ? {
          advanced: true,
          newPhase: phaseAdvancement.newPhase,
          message: phaseAdvancement.message
        } : null,
        swapOpportunity: swapOpportunity,
        userStats: {
          totalTokens: updatedUser.totalTokens.toString(),
          qrCodesScanned: updatedUser.qrCodesScanned
        }
      })
    } else {
      // Transfer failed - provide detailed error message and don't count as successful scan
      console.log('Transfer failed, not updating user progress:', transferResult.error)
      
      return NextResponse.json({
        success: false,
        error: 'Token transfer failed - scan not counted',
        transferError: transferResult.error,
        message: 'Your QR code scan was valid, but the token transfer failed. Please try scanning again.',
        details: {
          reason: transferResult.error,
          suggestion: 'This could be due to network issues, insufficient treasury balance, or blockchain connectivity problems. Please try again in a moment.'
        },
        scan: {
          id: scanRecord.id,
          tokensEarned: qrCodeRecord.tokenReward.toString(),
          status: 'FAILED',
          qrCode: {
            name: qrCodeRecord.name,
            rarity: qrCodeRecord.rarity,
            sequenceOrder: qrCodeRecord.sequenceOrder
          }
        },
        // Don't provide user stats or progress updates on failed transfers
        userProgress: {
          currentSequence: userRecord.scannedQRs.length, // Keep at current level
          nextQrNeeded: userRecord.scannedQRs.length + 1,
          message: 'Progress not updated due to transfer failure'
        }
      }, { status: 400 }) // Changed from 500 to 400 to indicate client should retry
    }

  } catch (error) {
    console.error('QR scan error:', error)
    return NextResponse.json(
      { error: 'QR scan failed. Please try again.' },
      { status: 500 }
    )
  }
})

async function updateLeaderboard(userId: string, qrRarity: string) {
  const updateData: {
    qrCodesScanned: { increment: number }
    rareQRsScanned?: { increment: number }
    legendaryQRsScanned?: { increment: number }
  } = {
    qrCodesScanned: { increment: 1 }
  }

  if (qrRarity === 'RARE') {
    updateData.rareQRsScanned = { increment: 1 }
  } else if (qrRarity === 'LEGENDARY') {
    updateData.legendaryQRsScanned = { increment: 1 }
  }

  // Get updated user stats
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalTokens: true,
      qrCodesScanned: true,
      lastScannedAt: true
    }
  })

  if (user) {
    await prisma.leaderboardEntry.update({
      where: { userId },
      data: {
        ...updateData,
        totalTokens: user.totalTokens,
        lastScanAt: user.lastScannedAt
      }
    })
  }
}

// Phase advancement function
async function checkPhaseAdvancement(userId: string, totalQRsScanned: number): Promise<{
  advanced: boolean
  newPhase?: string
  message?: string
}> {
  try {
    // Get current user phase
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentPhase: true }
    })

    if (!user) {
      return { advanced: false }
    }

    const currentPhase = user.currentPhase
    let shouldAdvance = false
    let newPhase = ''
    let message = ''

    // Phase advancement logic based on QR codes scanned
    if (currentPhase === 'PHASE_1' && totalQRsScanned >= 8) {
      // Completed Phase 1 (8 QR codes) - advance to Phase 2
      shouldAdvance = true
      newPhase = 'PHASE_2'
      message = '🎉 Congratulations! You\'ve completed Phase 1 and unlocked Phase 2: Rare Treasures!'
    } else if (currentPhase === 'PHASE_2' && totalQRsScanned >= 12) {
      // Completed Phase 2 (4 more QR codes, total 12) - advance to Phase 3
      shouldAdvance = true
      newPhase = 'PHASE_3'
      message = '🏆 Amazing! You\'ve completed Phase 2 and unlocked Phase 3: Legendary Quest!'
    }

    if (shouldAdvance) {
      // Update user's current phase
      await prisma.user.update({
        where: { id: userId },
        data: { currentPhase: newPhase as 'PHASE_1' | 'PHASE_2' | 'PHASE_3' }
      })

      console.log(`User ${userId} advanced from ${currentPhase} to ${newPhase}`)
      
      return {
        advanced: true,
        newPhase,
        message
      }
    }

    return { advanced: false }
  } catch (error) {
    console.error('Phase advancement check error:', error)
    return { advanced: false }
  }
}
