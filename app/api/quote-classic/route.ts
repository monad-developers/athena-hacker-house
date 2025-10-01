import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const res = await fetch(
    `https://api.0x.org/swap/quote?${searchParams}`,
    {
      headers: {
        "0x-api-key": process.env.ZEROX_API_KEY as string,
        "0x-version": "v2",
      },
    }
  );
  const data = await res.json();

  console.log(
    "classic quote api",
    `https://api.0x.org/swap/quote?${searchParams}`
  );

  return Response.json(data);
}


