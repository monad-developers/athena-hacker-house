import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const ZERO_X_API_KEY = process.env.ZERO_X_API_KEY;
const ZERO_X_API_BASE = 'https://api.0x.org';

if (!ZERO_X_API_KEY) {
  console.warn('ZERO_X_API_KEY environment variable is not set');
}

// Supported chains by 0x API (including Monad testnet)
const SUPPORTED_CHAINS = [
  10143, // Monad Testnet - Now supported
];

// 0x API endpoint for getting indicative prices
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');
  const chainId = searchParams.get('chainId') || '10143'; // Default to Monad testnet

  if (!sellToken || !buyToken || !sellAmount) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  const chainIdNum = parseInt(chainId);

  try {
    // Check if chain is supported by 0x
    if (!SUPPORTED_CHAINS.includes(chainIdNum)) {
      return NextResponse.json(
        { error: `Chain ${chainIdNum} not supported by 0x API` },
        { status: 400 }
      );
    }

    if (!ZERO_X_API_KEY) {
      return NextResponse.json(
        { error: 'ZERO_X_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    // Make request to 0x API v2 for supported chains
    const params = new URLSearchParams({
      chainId: chainId,
      sellToken,
      buyToken,
      sellAmount,
    });

    console.log('🔍 Proxying 0x v2 price request...');
    console.log('Request URL:', `${ZERO_X_API_BASE}/swap/permit2/price?${params}`);

    const response = await axios.get(
      `${ZERO_X_API_BASE}/swap/permit2/price?${params}`,
      {
        headers: {
          '0x-api-key': ZERO_X_API_KEY,
          '0x-version': 'v2',
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout for permit2 endpoint
      }
    );

    console.log('✅ 0x price response received');
    return NextResponse.json(response.data);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorData = error && typeof error === 'object' && 'response' in error ?
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error.response as any)?.data : undefined;
    console.error('❌ 0x price API failed:', errorData || errorMessage);
    return NextResponse.json(
      { error: `Failed to get price: ${errorData?.error || errorMessage}` },
      { status: 500 }
    );
  }
}

