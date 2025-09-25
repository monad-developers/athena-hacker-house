import { NextResponse } from 'next/server'
import { SwapService } from '@/lib/services/swap-service'
import { withAuth } from '@/lib/middleware/auth'
import { checkRateLimit } from '@/lib/middleware/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const executeSchema = z.object({
  opportunityId: z.string().min(1, 'Opportunity ID is required'),
  quote: z.object({
    sellToken: z.string(),
    buyToken: z.string(),
    sellAmount: z.string(),
    buyAmount: z.string(),
    allowanceTarget: z.string(),
    liquidityAvailable: z.boolean().optional()
  })
})

export const POST = withAuth(async (req, user) => {
  try {
    // Rate limiting - 3 swaps per 5 minutes per user
    const rateLimit = checkRateLimit(`swap-execute:${user.id}`, 3, 300000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many swap attempts. Please try again later.'
        },
        { status: 429, headers: { 'Retry-After': rateLimit.resetTime.toString() } }
      )
    }

    // Validate request body
    const body = await req.json()
    const { opportunityId } = executeSchema.parse(body)

    // Verify swap opportunity exists and is valid
    const opportunity = await prisma.swapOpportunity.findUnique({
      where: {
        id: opportunityId,
        userId: user.id,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      include: {
        swapTransactions: {
          where: { status: 'QUOTE_FETCHED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Invalid or expired swap opportunity' },
        { status: 400 }
      )
    }

    if (opportunity.swapTransactions.length === 0) {
      return NextResponse.json(
        { error: 'No valid quote found. Please get a new quote first.' },
        { status: 400 }
      )
    }

    const latestTransaction = opportunity.swapTransactions[0]

    // For allowance-holder pattern, we need to get a firm quote with transaction data
    // The quote from the frontend doesn't contain transaction data, so we need to get it fresh
    const firmQuote = await SwapService.getQuote({
      sellToken: latestTransaction.sellTokenSymbol as 'WMON' | 'USDT',
      buyToken: latestTransaction.buyTokenSymbol as 'WMON' | 'USDT',
      sellAmount: latestTransaction.sellAmount,
      takerAddress: user.walletAddress
    })

    // Execute the swap using the firm quote
    const result = await SwapService.executeSwap(firmQuote, user.walletAddress as `0x${string}`)

    // Update transaction record
    await prisma.swapTransaction.update({
      where: { id: latestTransaction.id },
      data: {
        transactionHash: result.txHash,
        status: 'TRANSACTION_SENT',
        executedAt: new Date()
      }
    })

    // Mark opportunity as used
    await prisma.swapOpportunity.update({
      where: { id: opportunityId },
      data: { isUsed: true }
    })

    return NextResponse.json({
      success: true,
      transactionHash: result.txHash,
      message: 'Swap executed successfully. Transaction submitted to blockchain.'
    })

  } catch (error) {
    console.error('Swap execution error:', error)

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      // Check if it's a treasury wallet error
      if (error.message.includes('Treasury wallet')) {
        return NextResponse.json(
          { error: 'Treasury wallet not configured properly' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to execute swap' },
      { status: 500 }
    )
  }
})
