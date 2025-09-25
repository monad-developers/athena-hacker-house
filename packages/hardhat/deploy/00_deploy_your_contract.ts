import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "BondingCurvePool" using the deployer account and
 * constructor arguments for name, symbol, and reserve ratio
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployBondingCurvePool: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Contract configuration
  const tokenName = "APPU";
  const tokenSymbol = "APPU";
  const reserveRatio = 50; // 50% reserve ratio (adjustable between 1-100)

  console.log(`Deploying BondingCurvePool with parameters:`);
  console.log(`- Token Name: ${tokenName}`);
  console.log(`- Token Symbol: ${tokenSymbol}`);
  console.log(`- Reserve Ratio: ${reserveRatio}%`);

  await deploy("BondingCurvePool", {
    from: deployer,
    // Contract constructor arguments
    args: [tokenName, tokenSymbol, reserveRatio],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const bondingCurvePool = await hre.ethers.getContract<Contract>("BondingCurvePool", deployer);

  console.log("🎉 BondingCurvePool deployed successfully!");
  console.log(`📍 Contract Address: ${await bondingCurvePool.getAddress()}`);
  console.log(`💰 Initial Price: ${await bondingCurvePool.calculateCurrentPrice()} wei per token`);
  console.log(`🔒 Reserve Ratio: ${await bondingCurvePool.reserveRatio()}%`);
  console.log(`💎 Token Name: ${await bondingCurvePool.name()}`);
  console.log(`🏷️  Token Symbol: ${await bondingCurvePool.symbol()}`);
};

export default deployBondingCurvePool;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags BondingCurvePool
deployBondingCurvePool.tags = ["BondingCurvePool"];
