const { ethers } = require("hardhat");

async function main() {
    console.log("Testing DiceBet contract compilation and deployment info...");

    // Get the contract factory
    const DiceBet = await ethers.getContractFactory("DiceBet");
    console.log("✅ Contract compiled successfully!");

    // Get deployment info without actually deploying
    const deploymentData = DiceBet.getDeployTransaction();
    console.log("📊 Deployment Info:");
    console.log("- Gas estimate:", deploymentData.gasLimit?.toString() || "Not available");
    console.log("- Contract size:", deploymentData.data?.length || "Not available", "bytes");

    // Show contract interface
    console.log("\n📋 Contract Interface:");
    const contractInterface = DiceBet.interface;
    console.log("- Functions:", contractInterface.fragments.filter(f => f.type === 'function').length);
    console.log("- Events:", contractInterface.fragments.filter(f => f.type === 'event').length);

    // Show main functions
    console.log("\n🔧 Main Functions:");
    const functions = contractInterface.fragments.filter(f => f.type === 'function');
    functions.forEach(func => {
        if (['placeBet', 'getBet', 'getPendingBet', 'getContractBalance'].includes(func.name)) {
            console.log(`- ${func.name}(${func.inputs.map(i => i.type).join(', ')})`);
        }
    });

    console.log("\n✅ Contract is ready for deployment!");
    console.log("\nTo deploy to Monad testnet:");
    console.log("1. Make sure you have testnet ETH");
    console.log("2. Set your PRIVATE_KEY in .env file");
    console.log("3. Run: npm run deploy:monad");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error.message);
        process.exit(1);
    });
