import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { checkRateLimit } from '@/lib/middleware/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const createOpportunitySchema = z.object({
  qrScanId: z.string().min(1, 'QR Scan ID is required'),
  expiresInHours: z.number().min(1).max(48).default(24)
})

// GET /api/swap/opportunities - Get user's swap opportunities
export const GET = withAuth(async (req, user) => {
  try {
    // Rate limiting - 30 requests per minute
    const rateLimit = checkRateLimit(`swap-opportunities:${user.id}`, 30, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.'
        },
        { status: 429, headers: { 'Retry-After': rateLimit.resetTime.toString() } }
      )
    }

    // Get all active swap opportunities for the user
    const opportunities = await prisma.swapOpportunity.findMany({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        qrScan: {
          include: {
            qrCode: true
          }
        },
        swapTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format opportunities for response
    const formattedOpportunities = opportunities.map((opp) => ({
      id: opp.id,
      createdAt: opp.createdAt,
      expiresAt: opp.expiresAt,
      isUsed: opp.isUsed,
      qrScan: {
        id: opp.qrScan.id,
        tokensEarned: opp.qrScan.tokensEarned,
        qrCode: {
          name: opp.qrScan.qrCode.name,
          rarity: opp.qrScan.qrCode.rarity,
          phase: opp.qrScan.qrCode.phase
        }
      },
      latestTransaction: opp.swapTransactions[0] ? {
        id: opp.swapTransactions[0].id,
        status: opp.swapTransactions[0].status,
        sellTokenSymbol: opp.swapTransactions[0].sellTokenSymbol,
        buyTokenSymbol: opp.swapTransactions[0].buyTokenSymbol,
        sellAmount: opp.swapTransactions[0].sellAmount,
        buyAmount: opp.swapTransactions[0].buyAmount,
        transactionHash: opp.swapTransactions[0].transactionHash
      } : null
    }))

    return NextResponse.json({
      success: true,
      opportunities: formattedOpportunities
    })

  } catch (error) {
    console.error('Get opportunities error:', error)
    return NextResponse.json(
      { error: 'Failed to get swap opportunities' },
      { status: 500 }
    )
  }
})

// POST /api/swap/opportunities - Create a new swap opportunity
export const POST = withAuth(async (req, user) => {
  try {
    // Rate limiting - 5 opportunity creations per minute
    const rateLimit = checkRateLimit(`swap-opportunity-create:${user.id}`, 5, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many opportunity creation requests. Please try again later.'
        },
        { status: 429, headers: { 'Retry-After': rateLimit.resetTime.toString() } }
      )
    }

    // Validate request body
    const body = await req.json()
    const { qrScanId, expiresInHours } = createOpportunitySchema.parse(body)

    // Verify the QR scan belongs to the user and was successful
    const qrScan = await prisma.userQRScan.findUnique({
      where: {
        id: qrScanId,
        userId: user.id,
        transferStatus: 'CONFIRMED'
      },
      include: {
        qrCode: true
      }
    })

    if (!qrScan) {
      return NextResponse.json(
        { error: 'Invalid QR scan or scan not confirmed yet' },
        { status: 400 }
      )
    }

    // Check if user already has an active swap opportunity for this scan
    const existingOpportunity = await prisma.swapOpportunity.findUnique({
      where: {
        qrScanId: qrScanId
      }
    })

    if (existingOpportunity) {
      return NextResponse.json(
        { error: 'Swap opportunity already exists for this QR scan' },
        { status: 400 }
      )
    }

    // Create new swap opportunity
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    const opportunity = await prisma.swapOpportunity.create({
      data: {
        userId: user.id,
        qrScanId: qrScanId,
        expiresAt: expiresAt
      }
    })

    return NextResponse.json({
      success: true,
      opportunity: {
        id: opportunity.id,
        createdAt: opportunity.createdAt,
        expiresAt: opportunity.expiresAt,
        qrScan: {
          id: qrScan.id,
          tokensEarned: qrScan.tokensEarned,
          qrCode: {
            name: qrScan.qrCode.name,
            rarity: qrScan.qrCode.rarity,
            phase: qrScan.qrCode.phase
          }
        }
      }
    })

  } catch (error) {
    console.error('Create opportunity error:', error)

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create swap opportunity' },
      { status: 500 }
    )
  }
})
