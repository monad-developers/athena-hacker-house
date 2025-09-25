import { NextRequest, NextResponse } from 'next/server'
import { getUserByWallet, createOrUpdateUser, authenticateRequest } from '@/lib/auth'
import { validateRequestBody, updateUserSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'

// Get current user profile
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address')
    const signature = request.headers.get('x-wallet-signature')
    const message = request.headers.get('x-wallet-message')

    // Authenticate request
    const authResult = await authenticateRequest(walletAddress || undefined, signature || undefined, message || undefined)
    
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile with scan history
    const user = await getUserByWallet(walletAddress!)

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address')
    const signature = request.headers.get('x-wallet-signature')
    const message = request.headers.get('x-wallet-message')

    // Authenticate request
    const authResult = await authenticateRequest(walletAddress || undefined, signature || undefined, message || undefined)
    
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nickname } = validateRequestBody(updateUserSchema, body)

    // Update user
    const user = await createOrUpdateUser(walletAddress!, nickname)

    return NextResponse.json({
      success: true,
      user,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    const { error: errorMessage, statusCode } = handleApiError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
