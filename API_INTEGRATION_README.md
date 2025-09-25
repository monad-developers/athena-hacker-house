# 0x API Integration Setup

This project integrates with the 0x API for real-time swap pricing and quote generation. Follow these steps to set up the API integration:

## Environment Setup

1. **Get a 0x API Key**
   - Visit [0x.org](https://0x.org/docs/introduction/getting-started)
   - Sign up and get your API key

2. **Configure Environment Variables**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your API key:
   ```bash
   NEXT_PUBLIC_ZERO_EX_API_KEY=your_api_key_here
   NEXT_PUBLIC_DEFAULT_CHAIN_ID=1
   NEXT_PUBLIC_ENABLE_SWAP_API=true
   ```

## Features Implemented

### ✅ Real-time Price Fetching
- Live price updates as you type amounts
- Support for multiple chains (Ethereum, Base, Polygon)
- Debounced API calls to prevent excessive requests

### ✅ Token Management
- Pre-configured token lists for popular tokens
- Support for ERC-20 tokens
- Automatic token validation

### ✅ Error Handling
- Network error handling
- API rate limit handling
- User-friendly error messages

### ✅ Loading States
- Price loading indicators
- Quote loading states
- Processing states during swaps

## API Integration Details

### Services Created:

1. **`src/services/zeroExApi.ts`** - Core API client
   - `fetchSwapPrice()` - Get indicative pricing
   - `fetchSwapQuote()` - Get firm quotes for execution
   - Error handling and response validation

2. **`src/services/config.ts`** - Configuration management
   - Environment variable handling
   - Chain configuration
   - Feature flags

3. **`src/services/tokenData.ts`** - Token and network data
   - Supported token lists
   - Network configurations
   - Helper functions for token lookup

### Hook Updates:

**`src/hooks/useSwap.ts`** - Enhanced with API integration
- Real-time price fetching
- Debounced API calls
- State management for loading/errors
- Quote management

### Component Updates:

**`src/components/swap/TokenSelection.tsx`**
- Real-time price display
- Loading indicators
- Error handling UI
- Dynamic token information

## Usage

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Enter swap details:**
   - The app will automatically fetch prices as you type
   - Real-time exchange rates are displayed
   - Proceed through the swap flow

## API Endpoints Used

Based on the specifications in `llm.md`:

- **GET** `/swap/allowance-holder/price` - Indicative pricing
- **GET** `/swap/allowance-holder/quote` - Firm quotes

## Supported Networks

- **Ethereum (Chain ID: 1)** - ETH, USDC, USDT, WBTC, DAI, UNI
- **Base (Chain ID: 8453)** - ETH, USDC, DAI, WETH
- **Polygon (Chain ID: 137)** - MATIC, USDC, USDT, WETH

## Error Handling

The app handles various error scenarios:
- Missing API key
- Network connectivity issues
- Invalid token pairs
- API rate limits
- Insufficient liquidity

## Next Steps

To complete the swap functionality:
1. Add wallet connection (WalletConnect, MetaMask)
2. Implement transaction signing
3. Add transaction monitoring
4. Add slippage protection
5. Implement multi-chain support

## Development Notes

- API calls are debounced (500ms) to prevent excessive requests
- Prices are fetched automatically when amount/tokens change
- All monetary amounts are properly formatted for display
- Error states are clearly communicated to users