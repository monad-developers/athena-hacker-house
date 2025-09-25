import { NextRequest, NextResponse } from 'next/server'
import { getTreasuryBalance, checkSufficientBalance } from '@/lib/web3/treasury-wallet'
import { validateWeb3Config } from '@/lib/web3/monad-provider'
import { handleApiError } from '@/lib/errors'

// Get treasury wallet balance
export async function GET(_request: NextRequest) {
  try {
    // Check Web3 configuration
    const configCheck = validateWeb3Config()
    if (!configCheck.isValid) {
      return NextResponse.json(
        { 
          error: 'Web3 configuration invalid',
          details: configCheck.errors
        },
        { status: 500 }
      )
    }

    const balance = await getTreasuryBalance()

    return NextResponse.json({
      success: true,
      balance: {
        native: {
          raw: balance.nativeBalance,
          formatted: balance.nativeBalanceFormatted,
          symbol: 'MON'
        },
        token: {
          raw: balance.tokenBalance,
          formatted: balance.tokenBalanceFormatted,
          symbol: 'CRUNCHIES'
        }
      }
    })

  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// Check if treasury has sufficient balance for a specific amount
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount } = body

    if (!amount || typeof amount !== 'string') {
      return NextResponse.json(
        { error: 'Amount is required and must be a string' },
        { status: 400 }
      )
    }

    const hasSufficientBalance = await checkSufficientBalance(amount)

    return NextResponse.json({
      success: true,
      hasSufficientBalance,
      requestedAmount: amount
    })

  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
