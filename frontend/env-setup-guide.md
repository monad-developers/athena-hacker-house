# Environment Variables Setup Guide

## Required Environment Variables

To fix the "Database is not getting updated after successful run" issue, you need to set up the following environment variables:

### 1. Web3/Blockchain Configuration

```bash
# Monad Testnet RPC URL
MONAD_RPC_URL="https://testnet-rpc.monad.xyz"

# Treasury wallet private key (must start with 0x)
TREASURY_PRIVATE_KEY="0x..."

# Token contract address on Monad testnet (must start with 0x)
TOKEN_CONTRACT_ADDRESS="0x..."

# Minimum MON balance for gas fees (optional, defaults to 0.1)
TREASURY_MIN_BALANCE="0.1"
```

## ⚠️ Important Chain ID Update

**Fixed Chain ID Issue**: Updated Monad testnet chain ID from `41454` to `10143` to match the current network configuration.

### 2. Database Configuration

```bash
# PostgreSQL database URL
DATABASE_URL="postgresql://username:password@localhost:5432/token_crunchies"
```

### 3. Authentication (if required)

```bash
# NextAuth secret
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Setup Steps

1. **Create `.env.local` file** in the frontend directory
2. **Copy the required variables** from above and fill in your values
3. **Get a treasury wallet private key** with MON tokens for gas
4. **Deploy or get the token contract address** on Monad testnet
5. **Restart your development server** after setting up the environment

## Troubleshooting

### Issue: "Database is not getting updated after successful run"

**Root Cause**: Missing Web3 configuration prevents token transfers from executing, which means the database update logic never runs.

**Solution**: Set up all the Web3 environment variables above.

### How to Test

Run the diagnostic script to check your setup:

```bash
npx tsx scripts/diagnose-web3.ts
```

This will tell you exactly what's missing or misconfigured.

### Treasury Wallet Requirements

Your treasury wallet needs:
1. **MON tokens** for gas fees (at least 0.1 MON recommended)
2. **Your custom tokens** to distribute to users
3. **Private key** added to environment variables

### Token Contract

You need to deploy an ERC-20 token contract on Monad testnet or use an existing one. The contract address must be added to `TOKEN_CONTRACT_ADDRESS`.

## Current Status

Based on the diagnosis, the following are missing:
- ❌ MONAD_RPC_URL
- ❌ TREASURY_PRIVATE_KEY  
- ❌ TOKEN_CONTRACT_ADDRESS

Once these are set up, QR code scanning will:
1. ✅ Extract QR metadata correctly
2. ✅ Find QR codes in database
3. ✅ Execute token transfers
4. ✅ Update user stats in database
5. ✅ Update leaderboard
