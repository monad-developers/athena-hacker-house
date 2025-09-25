# Deployment Guide - BatMon dApp

This guide will walk you through deploying the BatMon dApp to production.

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask wallet with Monad testnet configured
- Monad testnet tokens (get from [faucet](https://faucet.monad.xyz))
- WalletConnect project ID (get from [WalletConnect Cloud](https://cloud.walletconnect.com/))

## 🚀 Step-by-Step Deployment

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
PRIVATE_KEY=your_private_key_for_deployment
```

**Getting WalletConnect Project ID:**
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID

**Getting Private Key:**
1. Export your private key from MetaMask (Settings > Security & Privacy > Reveal Private Key)
2. **⚠️ Never commit this to version control!**

### 2. Smart Contract Deployment

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to Monad testnet
npm run deploy:monad
```

After deployment, you'll see output like:
```
DiceBet deployed to: 0x1234567890abcdef...
Contract owner: 0xabcdef1234567890...
Bet amount: 0.05 ETH
```

**Copy the contract address!**

### 3. Update Frontend Configuration

Update `src/lib/config.ts` with your deployed contract address:

```typescript
export const CONTRACT_CONFIG = {
  address: '0x1234567890abcdef...', // Your deployed contract address
  // ... rest of config
};
```

### 4. Frontend Deployment (Vercel)

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
vercel env add NEXT_PUBLIC_CONTRACT_ADDRESS
```

#### Option B: Vercel Dashboard
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Set environment variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
6. Deploy!

### 5. Verify Deployment

1. **Test the frontend:**
   - Visit your deployed URL
   - Connect MetaMask
   - Ensure you're on Monad testnet

2. **Test the contract:**
   - Place a test bet
   - Check transaction on [Monad Explorer](https://testnet.monadexplorer.com)
   - Verify events are emitted correctly

3. **Check contract balance:**
   - Visit the contract address on explorer
   - Ensure it can receive and send ETH

## 🔧 Configuration Details

### Monad Testnet Network
Add this network to MetaMask:
- **Network Name**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143
- **Currency Symbol**: MON
- **Block Explorer**: https://testnet.monadexplorer.com

### Contract Verification (Optional)
To verify your contract on the explorer:

1. Go to [Monad Explorer](https://testnet.monadexplorer.com)
2. Find your contract address
3. Click "Verify and Publish"
4. Upload your contract source code
5. Set compiler version to 0.8.19
6. Verify!

## 🛡️ Security Checklist

- [ ] Private key is not committed to version control
- [ ] Environment variables are set correctly
- [ ] Contract is deployed with correct parameters
- [ ] Frontend is using the correct contract address
- [ ] MetaMask is configured for Monad testnet
- [ ] Testnet tokens are available for testing

## 🐛 Troubleshooting

### Common Issues

**"Contract not found"**
- Verify contract address in config
- Ensure contract is deployed on correct network

**"Insufficient funds"**
- Get testnet tokens from [faucet](https://faucet.monad.xyz)
- Check wallet balance

**"Wrong network"**
- Switch to Monad testnet in MetaMask
- Verify network configuration

**"Transaction failed"**
- Check gas settings
- Ensure sufficient balance for gas
- Try increasing gas limit

### Getting Help

- Check [Monad docs](https://docs.monad.xyz/)
- Join [Monad Discord](https://discord.gg/monad)
- Review contract code and events

## 📊 Post-Deployment

### Monitoring
- Monitor contract events on explorer
- Check transaction success rates
- Monitor user interactions

### Maintenance
- Keep contract funded for payouts
- Monitor for any issues
- Update frontend if needed

## 🎯 Production Considerations

For mainnet deployment:
- Use proper VRF service (Gelato VRF)
- Implement proper access controls
- Add comprehensive testing
- Consider gas optimization
- Implement proper error handling
- Add rate limiting
- Consider multi-signature wallet for owner

---

**Happy deploying! 🚀**
