import { NextResponse } from 'next/server'
import { SwapService, WORKING_TOKENS } from '@/lib/services/swap-service'
import { withAuth } from '@/lib/middleware/auth'
import { checkRateLimit } from '@/lib/middleware/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const quoteSchema = z.object({
  sellToken: z.enum(['WMON', 'USDT']),
  buyToken: z.enum(['WMON', 'USDT']),
  sellAmount: z.string().min(1, 'Sell amount is required'),
  opportunityId: z.string().min(1, 'Opportunity ID is required')
})

export const POST = withAuth(async (req, user) => {
  try {
    // Rate limiting - 10 quotes per minute per user
    const rateLimit = checkRateLimit(`swap-quote:${user.id}`, 10, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many quote requests. Please try again later.'
        },
        { status: 429, headers: { 'Retry-After': rateLimit.resetTime.toString() } }
      )
    }

    // Validate request body
    const body = await req.json()
    const { sellToken, buyToken, sellAmount, opportunityId } = quoteSchema.parse(body)

    // Verify swap opportunity exists and is valid
    const opportunity = await prisma.swapOpportunity.findUnique({
      where: {
        id: opportunityId,
        userId: user.id,
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    })

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Invalid or expired swap opportunity' },
        { status: 400 }
      )
    }

    // Get quote from 0x API
    const quote = await SwapService.getQuote({
      sellToken,
      buyToken,
      sellAmount: SwapService.formatAmount(sellToken, sellAmount),
      takerAddress: user.walletAddress
    })

    // Update opportunity status to indicate quote was fetched
    await prisma.swapOpportunity.update({
      where: { id: opportunityId },
      data: {
        swapTransactions: {
          create: {
            userId: user.id,
            sellToken: WORKING_TOKENS[sellToken].address,
            sellTokenSymbol: sellToken,
            buyToken: WORKING_TOKENS[buyToken].address,
            buyTokenSymbol: buyToken,
            sellAmount: SwapService.formatAmount(sellToken, sellAmount),
            buyAmount: quote.buyAmount,
            status: 'QUOTE_FETCHED',
            zeroXQuoteId: quote.to // Store the contract address as quote ID for now
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      quote: {
        sellToken: WORKING_TOKENS[sellToken].address,
        buyToken: WORKING_TOKENS[buyToken].address,
        sellAmount: SwapService.formatAmount(sellToken, sellAmount),
        buyAmount: quote.buyAmount,
        price: quote.price,
        gas: quote.gas,
        gasPrice: quote.gasPrice,
        to: quote.to,
        data: quote.data,
        value: quote.value,
        allowanceTarget: quote.allowanceTarget,
        estimatedGas: quote.gas,
        liquidityAvailable: quote.liquidityAvailable
      }
    })

  } catch (error) {
    console.error('Swap quote error:', error)

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('INSUFFICIENT_ASSET_LIQUIDITY')) {
        return NextResponse.json(
          { error: 'No liquidity available for this token pair' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to get swap quote' },
      { status: 500 }
    )
  }
})
