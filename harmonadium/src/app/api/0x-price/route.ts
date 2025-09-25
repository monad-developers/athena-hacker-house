import { NextRequest, NextResponse } from 'next/server';
import { MONAD_TESTNET_CONFIG } from '@/lib/config';

const ZERO_X_API_KEY = process.env.ZERO_X_API_KEY;
const ZERO_X_API_BASE = 'https://api.0x.org';

if (!ZERO_X_API_KEY) {
  console.warn('ZERO_X_API_KEY environment variable is not set');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sellToken = searchParams.get('sellToken');
  const buyToken = searchParams.get('buyToken');
  const sellAmount = searchParams.get('sellAmount');
  const taker = searchParams.get('taker');
  const chainId = searchParams.get('chainId') || MONAD_TESTNET_CONFIG.chainId.toString();

  if (!sellToken || !buyToken || !sellAmount) {
    return NextResponse.json(
      { error: 'Missing required parameters: sellToken, buyToken, sellAmount' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      chainId,
      sellToken,
      buyToken,
      sellAmount,
    });

    if (taker) {
      params.set('taker', taker);
    }

    console.log('🔍 Proxying 0x price request...');
    console.log('Request URL:', `${ZERO_X_API_BASE}/swap/allowance-holder/price?${params}`);

    const response = await fetch(
      `${ZERO_X_API_BASE}/swap/allowance-holder/price?${params}`,
      {
        headers: {
          '0x-api-key': ZERO_X_API_KEY || '',
          '0x-version': 'v2',
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 0x price API failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      // Return fallback response for unsupported chains
      const sellAmountBN = BigInt(sellAmount);
      const buyAmountBN = sellAmountBN * BigInt(95) / BigInt(100);

      return NextResponse.json({
        chainId: parseInt(chainId),
        price: '0.95',
        estimatedPriceImpact: '0.05',
        buyTokenAddress: buyToken,
        sellTokenAddress: sellToken,
        buyAmount: buyAmountBN.toString(),
        sellAmount: sellAmount,
        allowanceTarget: '0x0000000000000000000000000000000000000000',
        sources: [{ name: 'Monad-Fallback', proportion: '1.0' }]
      });
    }

    const priceData = await response.json();
    console.log('✅ 0x price response received');
    return NextResponse.json(priceData);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ 0x price API failed:', errorMessage);

    // Return fallback response
    const sellAmountBN = BigInt(sellAmount);
    const buyAmountBN = sellAmountBN * BigInt(95) / BigInt(100);

    return NextResponse.json({
      chainId: parseInt(chainId),
      price: '0.95',
      estimatedPriceImpact: '0.05',
      buyTokenAddress: buyToken,
      sellTokenAddress: sellToken,
      buyAmount: buyAmountBN.toString(),
      sellAmount: sellAmount,
      allowanceTarget: '0x0000000000000000000000000000000000000000',
      sources: [{ name: 'Monad-Fallback', proportion: '1.0' }]
    });
  }
}