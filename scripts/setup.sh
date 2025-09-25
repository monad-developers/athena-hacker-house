#!/bin/bash

echo "🎲 Setting up BatMon dApp..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install contract dependencies
echo "📦 Installing contract dependencies..."
cd contracts
npm install

# Compile contracts
echo "🔨 Compiling smart contracts..."
npm run compile

echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Get testnet tokens from https://faucet.monad.xyz"
echo "2. Deploy the contract: cd contracts && npm run deploy:monad"
echo "3. Update the contract address in src/lib/config.ts"
echo "4. Start the development server: npm run dev"
echo ""
echo "📚 For detailed instructions, see README.md"
