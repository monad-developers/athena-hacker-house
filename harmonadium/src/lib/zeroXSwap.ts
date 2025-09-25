import axios from 'axios';
import { ethers } from 'ethers';

// Using internal API routes to avoid CORS issues

export interface ZeroXQuote {
  chainId: number;
  price: string;
  guaranteedPrice?: string;
  estimatedPriceImpact: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  estimatedGas: string;
  gasPrice: string;
  protocolFee?: string;
  minimumProtocolFee?: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  buyAmount: string;
  sellAmount: string;
  allowanceTarget: string;
  decodedUniqueId?: string;
  transaction?: {
    to: string;
    data: string;
    gas: string;
    gasPrice: string;
    value: string;
  };
}

export interface ZeroXPrice {
  chainId: number;
  price: string;
  estimatedPriceImpact: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  buyAmount: string;
  sellAmount: string;
  allowanceTarget: string;
}

export class ZeroXSwapService {
  constructor() {
    // No API key needed since we use internal routes
  }


  async getPrice(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    chainId: number = 10143
  ): Promise<ZeroXPrice> {
    try {
      const params = new URLSearchParams({
        sellToken,
        buyToken,
        sellAmount,
        chainId: chainId.toString(),
      });

      console.log('🔍 Fetching price via internal API...');
      console.log('Request URL:', `/api/price?${params}`);

      const response = await axios.get(`/api/price?${params}`);

      console.log('✅ Internal API price response:', response.data);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorData = error && typeof error === 'object' && 'response' in error ?
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error.response as any)?.data : undefined;
      console.error('❌ Internal price API failed:', errorData || errorMessage);
      throw new Error(`Failed to get price quote: ${errorData?.error || errorMessage}`);
    }
  }

  async getQuote(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    takerAddress: string,
    slippagePercentage: number = 0.01,
    chainId: number = 10143
  ): Promise<ZeroXQuote> {
    try {
      const params = new URLSearchParams({
        sellToken,
        buyToken,
        sellAmount,
        takerAddress,
        slippagePercentage: slippagePercentage.toString(),
        chainId: chainId.toString(),
      });

      console.log('🔍 Fetching quote via internal API...');
      console.log('Request URL:', `/api/quote?${params}`);

      const response = await axios.get(`/api/quote?${params}`);

      console.log('✅ Internal API quote response:', response.data);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorData = error && typeof error === 'object' && 'response' in error ?
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error.response as any)?.data : undefined;
      console.error('❌ Internal quote API failed:', errorData || errorMessage);
      throw new Error(`Failed to get quote: ${errorData?.error || errorMessage}`);
    }
  }

  async swapNativeToToken(
    targetTokenAddress: string,
    nativeAmount: string,
    takerAddress: string,
    chainId: number = 10143,
    slippagePercentage: number = 0.01
  ): Promise<ZeroXQuote> {
    // Use appropriate native token format for 0x API
    const nativeToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // 0x standard native token format

    console.log(`🔄 Swapping native token to ${targetTokenAddress} on chain ${chainId}`);
    console.log(`💰 Amount: ${ethers.formatEther(nativeAmount)} tokens`);

    // Use 0x API for all supported chains including Monad
    return this.getQuote(
      nativeToken,
      targetTokenAddress,
      nativeAmount,
      takerAddress,
      slippagePercentage,
      chainId
    );
  }

  async checkTokenSupport(tokenAddress: string, chainId: number = 10143): Promise<boolean> {
    try {
      // Use native token format for the specific chain
      const nativeToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      await this.getPrice(nativeToken, tokenAddress, ethers.parseEther('0.01').toString(), chainId);
      return true;
    } catch {
      console.warn(`Token ${tokenAddress} not supported on chain ${chainId}`);
      return false;
    }
  }
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
}

export function createSwapTransaction(quote: ZeroXQuote, fromAddress: string): SwapTransaction {
  return {
    from: fromAddress,
    to: quote.to,
    data: quote.data,
    value: quote.value,
    gasPrice: quote.gasPrice,
    gasLimit: quote.gas,
  };
}

// Initialize the service
export const zeroXSwapService = new ZeroXSwapService();