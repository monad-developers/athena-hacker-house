const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying DiceBet contract...");

    // Get the signer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

    // Get the contract factory
    const DiceBet = await ethers.getContractFactory("DiceBet", deployer);

    // Deploy the contract with gas settings
    const diceBet = await DiceBet.deploy({
        gasLimit: 10000000,
        gasPrice: ethers.parseUnits("100", "gwei")
    });

    // Wait for deployment to complete
    await diceBet.waitForDeployment();

    const contractAddress = await diceBet.getAddress();
    console.log("DiceBet deployed to:", contractAddress);
    console.log("Contract owner:", await diceBet.owner());
    console.log("Min bet amount:", ethers.formatEther(await diceBet.getMinBetAmount()), "ETH");
    console.log("Max bet amount:", ethers.formatEther(await diceBet.getMaxBetAmount()), "ETH");

    // Save deployment info
    const deploymentInfo = {
        contractAddress: contractAddress,
        network: "monadTestnet",
        chainId: 10143,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        minBetAmount: ethers.formatEther(await diceBet.getMinBetAmount()),
        maxBetAmount: ethers.formatEther(await diceBet.getMaxBetAmount())
    };

    console.log("\nDeployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    console.log("\nNext steps:");
    console.log("1. Copy the contract address above");
    console.log("2. Update the CONTRACT_ADDRESS in your frontend config");
    console.log("3. Fund the contract with some ETH for payouts");
    console.log("4. Test the contract on Monad testnet");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
