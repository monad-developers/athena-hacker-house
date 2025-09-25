/**
 * 0x API Service
 * Based on the specifications in llm.md
 * Handles swap price fetching, quote generation, and trade execution
 */

// API Configuration
const API_BASE_URL = 'https://api.0x.org';
const API_VERSION = 'v2';

// Headers factory function
const createHeaders = (apiKey?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['0x-api-key'] = apiKey;
  }

  return headers;
};

// Types for API responses
export interface SwapPriceResponse {
  price: string;
  estimatedGas: number;
  buyAmount: string;
  sellAmount: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  allowanceTarget: string;
  issues?: {
    allowance?: {
      spender: string;
    };
  };
  sources: Array<{
    name: string;
    proportion: string;
  }>;
}

export interface SwapQuoteResponse extends SwapPriceResponse {
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
}

export interface SwapParams {
  chainId: number;
  buyToken: string;
  sellToken: string;
  sellAmount: string;
  taker?: string;
}

// Error handling
export class ZeroExApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ZeroExApiError';
  }
}

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    throw new ZeroExApiError(
      errorData.message || `API Error: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

/**
 * Fetches an indicative price for a swap
 * Uses our Next.js API proxy to avoid CORS issues
 */
export async function fetchSwapPrice(
  params: SwapParams,
  apiKey?: string
): Promise<SwapPriceResponse> {
  const { chainId, buyToken, sellToken, sellAmount, taker } = params;
  
  const searchParams = new URLSearchParams({
    chainId: chainId.toString(),
    buyToken,
    sellToken,
    sellAmount,
  });

  if (taker) {
    searchParams.append('taker', taker);
  }

  const url = `/api/swap/price?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse<SwapPriceResponse>(response);
  } catch (error) {
    if (error instanceof ZeroExApiError) {
      throw error;
    }
    throw new ZeroExApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches a firm quote for swap execution
 * Uses our Next.js API proxy to avoid CORS issues
 */
export async function fetchSwapQuote(
  params: SwapParams,
  apiKey?: string
): Promise<SwapQuoteResponse> {
  const { chainId, buyToken, sellToken, sellAmount, taker } = params;
  
  const searchParams = new URLSearchParams({
    chainId: chainId.toString(),
    buyToken,
    sellToken,
    sellAmount,
  });

  if (taker) {
    searchParams.append('taker', taker);
  }

  const url = `/api/swap/quote?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleApiResponse<SwapQuoteResponse>(response);
  } catch (error) {
    if (error instanceof ZeroExApiError) {
      throw error;
    }
    throw new ZeroExApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Utility function to format token amounts
 */
export function formatTokenAmount(amount: string, decimals: number = 18): string {
  const numAmount = parseFloat(amount);
  const divisor = Math.pow(10, decimals);
  return (numAmount / divisor).toString();
}

/**
 * Utility function to parse token amounts to base units
 */
export function parseTokenAmount(amount: string, decimals: number = 18): string {
  const numAmount = parseFloat(amount);
  const multiplier = Math.pow(10, decimals);
  return Math.floor(numAmount * multiplier).toString();
}

/**
 * Calculate price impact percentage
 */
export function calculatePriceImpact(
  expectedPrice: string,
  actualPrice: string
): string {
  const expected = parseFloat(expectedPrice);
  const actual = parseFloat(actualPrice);
  const impact = ((actual - expected) / expected) * 100;
  return impact.toFixed(2);
}

/**
 * Validate API key format (basic validation)
 */
export function validateApiKey(apiKey: string): boolean {
  return typeof apiKey === 'string' && apiKey.length > 0;
}

// Export the main API functions
export const zeroExApi = {
  fetchSwapPrice,
  fetchSwapQuote,
  formatTokenAmount,
  parseTokenAmount,
  calculatePriceImpact,
  validateApiKey,
};