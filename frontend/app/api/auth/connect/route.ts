import { NextRequest, NextResponse } from 'next/server'
import { verifyWalletSignature, createOrUpdateUser } from '@/lib/auth'
import { validateRequestBody, walletConnectSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, signature, message, nickname } = validateRequestBody(
      walletConnectSchema,
      body
    )

    // Verify wallet signature
    const authResult = await verifyWalletSignature(walletAddress, signature, message)

    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    // Create or update user with custom nickname if provided
    const user = await createOrUpdateUser(walletAddress, nickname)

    return NextResponse.json({
      success: true,
      user,
      message: 'Wallet connected successfully'
    })

  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// Generate authentication message
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const message = `Welcome to Token Crunchies!\n\nSign this message to authenticate your wallet.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`

    return NextResponse.json({
      message,
      timestamp
    })

  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
