# Nokia Swap - Snake Game with Auto-Swap

A Nokia phone-themed React app featuring a Snake game that automatically triggers a token swap when the player reaches 6 points. Built with React, Vite, Wagmi, and 0x API integration.

## Features

- 🐍 **Snake Game**: Classic Nokia-style snake game
- 🔄 **Auto-Swap**: Automatically swaps MON to USDC when reaching 6 points
- 📱 **Nokia UI**: Retro Nokia phone interface
- 🔗 **Wallet Integration**: Connect with MetaMask, WalletConnect, and other wallets
- ⛽ **Gasless Options**: Supports gasless swaps via 0x API

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp env.example .env
```

Required environment variables:

```env
# 0x API Configuration (required for swaps)
VITE_ZEROEX_API_KEY=your_0x_api_key_here
VITE_ZEROEX_CHAIN_ID=10143

# Monad Chain Configuration
VITE_MONAD_CHAIN_ID=10143
VITE_MONAD_RPC_URL=https://rpc.monad.xyz

# Token Configuration
VITE_USDC_ADDRESS=0xyour_usdc_contract_address_here

# WalletConnect (optional)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

### 3. Get API Keys

- **0x API Key**: Visit [dashboard.0x.org](https://dashboard.0x.org) to get your API key
- **WalletConnect Project ID**: Visit [cloud.walletconnect.com](https://cloud.walletconnect.com) (optional)

### 4. Run Development Server

```bash
npm run dev
```

## How It Works

1. **Connect Wallet**: Click the wallet icon to connect your wallet
2. **Play Snake**: Use arrow keys or click/tap to control the snake
3. **Auto-Swap**: When you reach 6 points, the app automatically triggers a swap from MON to USDC
4. **Transaction**: Confirm the swap transaction in your wallet

## Swap Configuration

The swap is configured to trade:
- **From**: 0.01 MON (native Monad token)
- **To**: USDC (configured via `VITE_USDC_ADDRESS`)
- **Trigger**: Automatically when score reaches 6 points

## Supported Chains

- Ethereum Mainnet
- Monad (configured via environment variables)
- Sepolia Testnet

## Built With

- React 19
- Vite
- Wagmi (Web3 React)
- 0x API
- Viem

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```
