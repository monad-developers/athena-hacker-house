deployed link: https://betmon.vercel.app/

# BatMon dApp - Monad Blockchain

A decentralized BatMonting game built on the Monad testnet blockchain. Players can bet on dice rolls with on-chain verifiable randomness.

## 🎲 Features

- **Web3 Integration**: Connect MetaMask wallet and interact with smart contracts
- **Dynamic Betting**: Set your own bet amount (0.001 - 1.0 ETH)
- **Fair Gaming**: On-chain verifiable randomness ensures fair dice rolls
- **Token Swap**: Convert winnings to USDC using 0x Protocol
- **Real-time Updates**: Live transaction status and game results
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Monad Testnet**: Built specifically for Monad blockchain (Chain ID: 10143)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask wallet
- Monad testnet tokens (get from [faucet](https://faucet.monad.xyz))

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd dice-bait
npm install
```

2. **Install contract dependencies:**
```bash
cd contracts
npm install
```

3. **Deploy the smart contract:**
```bash
# Compile contracts
npm run compile

# Deploy to Monad testnet (requires PRIVATE_KEY in .env)
npm run deploy:monad
```

4. **Update contract address:**
After deployment, copy the contract address and update `src/lib/config.ts`:
```typescript
export const CONTRACT_CONFIG = {
  address: 'YOUR_DEPLOYED_CONTRACT_ADDRESS', // Replace this
  // ... rest of config
};
```

5. **Start the development server:**
```bash
cd ..
npm run dev
```

6. **Open your browser:**
Navigate to `http://localhost:3000`

## 🎮 How to Play

1. **Connect Wallet**: Click "Connect Wallet & Play" and connect your MetaMask
2. **Get Testnet Tokens**: Visit the [Monad faucet](https://faucet.monad.xyz) to get testnet ETH
3. **Add Monad Testnet**: If not already added, MetaMask will prompt you to add the network
4. **Choose Number**: Select a number between 1-6
5. **Set Bet Amount**: Enter your bet amount (0.001 - 1.0 ETH)
6. **Place Bet**: Click "Roll the Dice" to place your bet
7. **Watch Results**: See the dice roll animation and find out if you won!
8. **Swap to USDC**: When you win, convert your MON winnings to USDC using 0x Protocol

## 🏗️ Architecture

### Smart Contract (`contracts/DiceBet.sol`)
- **Ownable**: Platform owner can withdraw funds
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Dynamic Bet Amounts**: 0.001 - 1.0 ETH per bet
- **On-chain Randomness**: Uses block-based randomness (simplified for demo)
- **Events**: Emits BetPlaced, DiceRolled, and PayoutSent events

### Token Swap Integration
- **Multi-Source Pricing**: CoinGecko API, 0x Protocol, and mock pricing fallbacks
- **Real-time Quotes**: Live pricing and conversion rates with multiple data sources
- **Demo Mode**: Mock pricing for hackathon showcase when APIs are unavailable
- **Secure Transactions**: Uses wagmi for transaction execution
- **USDC Conversion**: Convert MON winnings to USDC with over-engineered swap functionality

### Frontend (`src/`)
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Wagmi + RainbowKit**: Web3 wallet integration
- **Ethers.js v6**: Blockchain interactions
- **Tailwind CSS**: Styling and animations
- **React Hot Toast**: Notifications

### Key Components
- `GameInterface`: Main game screen
- `BetForm`: Number selection and bet placement
- `DiceRoller`: Dice animation and results
- `TransactionStatus`: Real-time transaction updates
- `useDiceBet`: Custom hook for contract interactions

## 🔧 Configuration

### Monad Testnet Details
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Currency**: MON
- **Explorer**: https://testnet.monadexplorer.com
- **Faucet**: https://faucet.monad.xyz

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
PRIVATE_KEY=your_private_key_for_deployment
```

## 📁 Project Structure

```
dice-bait/
├── contracts/                 # Smart contracts
│   ├── DiceBet.sol           # Main game contract
│   ├── scripts/              # Deployment scripts
│   └── package.json          # Contract dependencies
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── layout.tsx        # Root layout with providers
│   │   ├── page.tsx          # Landing page
│   │   └── providers.tsx     # Web3 providers
│   ├── components/           # React components
│   │   ├── GameInterface.tsx # Main game interface
│   │   ├── BetForm.tsx       # Betting form
│   │   ├── DiceRoller.tsx    # Dice animation
│   │   └── TransactionStatus.tsx
│   ├── hooks/                # Custom React hooks
│   │   └── useDiceBet.ts     # Contract interaction hook
│   └── lib/                  # Utilities and config
│       ├── config.ts         # App configuration
│       ├── wagmi.ts          # Wagmi configuration
│       └── contract.ts       # Contract utilities
├── package.json              # Frontend dependencies
└── README.md
```

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Smart Contract
1. Get testnet tokens from faucet
2. Set `PRIVATE_KEY` in environment
3. Run deployment script
4. Verify contract on explorer (optional)

## 🛡️ Security Considerations

- **Reentrancy Protection**: Contract uses OpenZeppelin's ReentrancyGuard
- **Access Control**: Only owner can withdraw platform funds
- **Input Validation**: All inputs are validated
- **Fixed Bet Amount**: Prevents manipulation of bet amounts
- **Event Logging**: All important actions are logged as events

## 🔮 Future Enhancements

- **VRF Integration**: Use Gelato VRF for true verifiable randomness
- **Multiple Bet Amounts**: Allow different bet sizes
- **Game History**: Show previous bets and results
- **Leaderboard**: Track top players
- **Mobile App**: React Native version
- **Tournament Mode**: Multi-player competitions

## 🐛 Troubleshooting

### Common Issues

1. **"Insufficient funds"**: Get testnet tokens from faucet
2. **"Wrong network"**: Switch to Monad testnet in MetaMask
3. **"Contract not found"**: Update contract address in config
4. **"Transaction failed"**: Check gas settings and try again

### Getting Help

- Check the [Monad docs](https://docs.monad.xyz/)
- Join the [Monad Discord](https://discord.gg/monad)
- Review contract code in `contracts/DiceBet.sol`

## 📄 License

MIT License - feel free to use this code for your own projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with ❤️ for the Monad ecosystem**