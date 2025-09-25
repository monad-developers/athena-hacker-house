import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get all query parameters
  const chainId = searchParams.get('chainId');
  const buyToken = searchParams.get('buyToken');
  const sellToken = searchParams.get('sellToken');
  const sellAmount = searchParams.get('sellAmount');
  const taker = searchParams.get('taker');

  if (!chainId || !buyToken || !sellToken || !sellAmount || !taker) {
    return NextResponse.json(
      { error: 'Missing required parameters (taker is required for quotes)' },
      { status: 400 }
    );
  }

  // Build the 0x API URL
  const apiUrl = new URL('https://api.0x.org/swap/allowance-holder/quote');
  apiUrl.searchParams.set('chainId', chainId);
  apiUrl.searchParams.set('buyToken', buyToken);
  apiUrl.searchParams.set('sellToken', sellToken);
  apiUrl.searchParams.set('sellAmount', sellAmount);
  apiUrl.searchParams.set('taker', taker);

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        '0x-api-key': process.env.NEXT_PUBLIC_ZERO_EX_API_KEY || '',
        '0x-version': 'v2',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `0x API Error: ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}