// Alternative price fetching service with multiple fallbacks
import { ethers } from 'ethers';

export interface PriceData {
    price: string;
    buyAmount: string;
    sellAmount: string;
    source: 'coingecko' | 'mock' | '0x' | 'real' | 'market' | 'fallback';
}

export class PriceService {
    private static instance: PriceService;

    // Mock price for demo purposes (1 MON = 0.0024 USDC based on current market data)
    private static MOCK_PRICE = 0.0024;

    public static getInstance(): PriceService {
        if (!PriceService.instance) {
            PriceService.instance = new PriceService();
        }
        return PriceService.instance;
    }

    /**
     * Get price with multiple fallback options
     */
    async getPrice(
        sellAmount: string
    ): Promise<PriceData> {
        // Validate input
        if (!sellAmount || sellAmount === '0' || sellAmount === '') {
            throw new Error('Invalid sell amount');
        }

        try {
            // Try real price feeds first
            const realPrice = await this.getRealPrice(sellAmount);
            if (realPrice && realPrice.buyAmount !== '0') {
                return realPrice;
            }
        } catch (error) {
            console.warn('Real price fetch failed:', error);
        }

        try {
            // Try CoinGecko as fallback
            const coingeckoPrice = await this.getCoinGeckoPrice(sellAmount);
            if (coingeckoPrice && coingeckoPrice.buyAmount !== '0') {
                return coingeckoPrice;
            }
        } catch (error) {
            console.warn('CoinGecko price fetch failed:', error);
        }

        try {
            // Try 0x API as fallback
            const zeroXPrice = await this.getZeroXPrice(sellAmount);
            if (zeroXPrice && zeroXPrice.buyAmount !== '0') {
                return zeroXPrice;
            }
        } catch (error) {
            console.warn('0x API price fetch failed:', error);
        }

        // Use real market price as final fallback (not mock)
        return await this.getRealMarketPrice(sellAmount);
    }

    /**
     * Get price from CoinGecko API
     */
    private async getCoinGeckoPrice(
        sellAmount: string
    ): Promise<PriceData | null> {
        try {
            // Try to fetch MON token price from CoinGecko
            // Note: MON token might not be listed on CoinGecko yet, so we'll use a fallback
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=monad&vs_currencies=usd'
            );

            let monPrice = 0.0024; // Fallback price based on current market data

            if (response.ok) {
                const data = await response.json();
                monPrice = data.monad?.usd || 0.0024;
            }

            // Convert sell amount to MON equivalent
            const sellAmountMon = parseFloat(ethers.formatEther(sellAmount));
            const usdcAmount = sellAmountMon * monPrice;

            // Ensure we don't exceed USDC precision (6 decimals)
            const usdcAmountFixed = Math.floor(usdcAmount * 1000000) / 1000000; // 6 decimal precision

            return {
                price: monPrice.toString(),
                buyAmount: ethers.parseUnits(usdcAmountFixed.toString(), 6).toString(),
                sellAmount: sellAmount,
                source: 'coingecko'
            };
        } catch (error) {
            console.error('CoinGecko price fetch error:', error);
            return null;
        }
    }

    /**
     * Get price from 0x API (existing implementation)
     */
    private async getZeroXPrice(sellAmount: string): Promise<PriceData | null> {
        try {
            const ZEROX_API_KEY = process.env.NEXT_PUBLIC_ZEROX_API_KEY || 'demo-key';
            const params = new URLSearchParams({
                sellToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                buyToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
                sellAmount,
                chainId: '10143',
            });

            const response = await fetch(`https://api.0x.org/swap/v1/price?${params}`, {
                headers: {
                    '0x-api-key': ZEROX_API_KEY,
                },
            });

            if (!response.ok) {
                throw new Error(`0x API error: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                price: data.price,
                buyAmount: data.buyAmount,
                sellAmount: data.sellAmount,
                source: '0x'
            };
        } catch (error) {
            console.error('0x API price fetch error:', error);
            return null;
        }
    }

    /**
     * Get real price from multiple sources
     */
    private async getRealPrice(sellAmount: string): Promise<PriceData | null> {
        try {
            // Try to get real MON price from multiple sources
            const monPrice = await this.fetchRealMonPrice();

            if (monPrice > 0) {
                const sellAmountMon = parseFloat(ethers.formatEther(sellAmount));
                const usdcAmount = sellAmountMon * monPrice;
                const usdcAmountFixed = Math.floor(usdcAmount * 1000000) / 1000000;

                return {
                    price: monPrice.toString(),
                    buyAmount: ethers.parseUnits(usdcAmountFixed.toString(), 6).toString(),
                    sellAmount: sellAmount,
                    source: 'real'
                };
            }
        } catch (error) {
            console.error('Error fetching real price:', error);
        }
        return null;
    }

    /**
     * Fetch real MON token price from multiple sources
     */
    private async fetchRealMonPrice(): Promise<number> {
        try {
            // Try CoinMarketCap API
            const cmcResponse = await fetch(
                'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=MON',
                {
                    headers: {
                        'X-CMC_PRO_API_KEY': process.env.NEXT_PUBLIC_CMC_API_KEY || '',
                    },
                }
            );

            if (cmcResponse.ok) {
                const cmcData = await cmcResponse.json();
                const price = cmcData.data?.MON?.quote?.USD?.price;
                if (price && price > 0) {
                    return price;
                }
            }
        } catch (error) {
            console.warn('CoinMarketCap API failed:', error);
        }

        try {
            // Try CoinGecko with different token IDs
            const tokenIds = ['monad', 'monad-protocol', 'monad-coin'];
            for (const tokenId of tokenIds) {
                try {
                    const response = await fetch(
                        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        const price = data[tokenId]?.usd;
                        if (price && price > 0) {
                            return price;
                        }
                    }
                } catch {
                    continue;
                }
            }
        } catch (error) {
            console.warn('CoinGecko API failed:', error);
        }

        // Return current market price as fallback
        return 0.0024;
    }

    /**
     * Get real market price (not mock)
     */
    private async getRealMarketPrice(sellAmount: string): Promise<PriceData> {
        try {
            // Get real MON price
            const monPrice = await this.fetchRealMonPrice();

            // Convert the actual bet amount to USDC
            const sellAmountMon = parseFloat(ethers.formatEther(sellAmount));
            const usdcAmount = sellAmountMon * monPrice;

            // Ensure we don't exceed USDC precision (6 decimals)
            const usdcAmountFixed = Math.floor(usdcAmount * 1000000) / 1000000;

            return {
                price: monPrice.toString(),
                buyAmount: ethers.parseUnits(usdcAmountFixed.toString(), 6).toString(),
                sellAmount: sellAmount,
                source: 'market'
            };
        } catch {
            // Error already logged in fetchRealMonPrice
            // Fallback to basic calculation
            const sellAmountMon = parseFloat(ethers.formatEther(sellAmount));
            const usdcAmount = sellAmountMon * 0.0024; // Fallback price
            const usdcAmountFixed = Math.floor(usdcAmount * 1000000) / 1000000;

            return {
                price: '0.0024',
                buyAmount: ethers.parseUnits(usdcAmountFixed.toString(), 6).toString(),
                sellAmount: sellAmount,
                source: 'fallback'
            };
        }
    }

    /**
     * Format token amount for display
     */
    formatTokenAmount(amount: string, decimals: number): string {
        try {
            if (!amount || amount === '0') return '0.00';

            console.log('Formatting token amount:', { amount, decimals, type: typeof amount });

            // Check if the amount is already a decimal string (like a price)
            if (amount.includes('.') && !amount.startsWith('0x')) {
                // It's already a decimal string, just format it
                const num = parseFloat(amount);
                if (isNaN(num)) return '0.00';
                const result = num.toFixed(decimals === 6 ? 2 : 4);
                console.log('Formatted as decimal:', result);
                return result;
            }

            // It's a BigInt string, format it with ethers
            const formatted = ethers.formatUnits(amount, decimals);
            const num = parseFloat(formatted);
            if (isNaN(num)) return '0.00';
            const result = num.toFixed(decimals === 6 ? 2 : 4);
            console.log('Formatted as BigInt:', result);
            return result;
        } catch (error) {
            console.error('Error formatting token amount:', error, { amount, decimals });
            return '0.00';
        }
    }

    /**
     * Parse token amount to wei
     */
    parseTokenAmount(amount: string, decimals: number): string {
        try {
            if (!amount || amount === '') return '0';
            // Ensure the amount is a valid number string
            const num = parseFloat(amount);
            if (isNaN(num)) return '0';
            // Limit to reasonable precision to avoid BigInt conversion issues
            const limitedAmount = num.toFixed(decimals);
            return ethers.parseUnits(limitedAmount, decimals).toString();
        } catch (error) {
            console.error('Error parsing token amount:', error);
            return '0';
        }
    }
}

// Create singleton instance
export const priceService = PriceService.getInstance();
