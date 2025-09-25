import { NextRequest, NextResponse } from "next/server";

// Proxy to 0x API to avoid CORS and keep API key server-side
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Prefer explicit chainId from client, else fall back to Monad env, else 10143 (Monad Testnet)
    const chainId =
      searchParams.get("chainId") ||
      process.env.NEXT_PUBLIC_ZEROEX_CHAIN_ID ||
      process.env.NEXT_PUBLIC_MONAD_CHAIN_ID ||
      "10143";
    const sellToken = searchParams.get("sellToken");
    const buyToken = searchParams.get("buyToken");
    const sellAmount = searchParams.get("sellAmount");
    const taker = searchParams.get("taker");

    if (!sellToken || !buyToken || !sellAmount || !taker) {
      return NextResponse.json(
        { error: "Missing required params: sellToken, buyToken, sellAmount, taker" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      taker,
    });

    const apiKey = process.env.ZEROEX_API_KEY || process.env.NEXT_PUBLIC_ZEROEX_API_KEY || "";
    const res = await fetch(
      `https://api.0x.org/swap/allowance-holder/quote?${params.toString()}`,
      {
        headers: {
          "0x-version": "v2",
          ...(apiKey ? { "0x-api-key": apiKey } : {}),
        },
        // Don't cache quotes
        cache: "no-store",
      }
    );

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


