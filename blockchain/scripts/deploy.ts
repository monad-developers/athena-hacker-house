import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy GovernmentRegistry (SBT)
  const GovernmentRegistry = await ethers.getContractFactory("GovernmentRegistry");
  const govReg = await GovernmentRegistry.deploy(deployer.address);
  await govReg.waitForDeployment();
  console.log("GovernmentRegistry:", await govReg.getAddress());

  // Deploy JuryStaking
  const JuryStaking = await ethers.getContractFactory("JuryStaking");
  const jury = await JuryStaking.deploy(deployer.address);
  await jury.waitForDeployment();
  console.log("JuryStaking:", await jury.getAddress());

  // Deploy BeneficiaryRegistry
  const BeneficiaryRegistry = await ethers.getContractFactory("BeneficiaryRegistry");
  const benReg = await BeneficiaryRegistry.deploy(deployer.address, await govReg.getAddress(), await jury.getAddress());
  await benReg.waitForDeployment();
  console.log("BeneficiaryRegistry:", await benReg.getAddress());

  // Deploy Donations V2
  const MonadReliefV2 = await ethers.getContractFactory("MonadReliefV2");
  const relief = await MonadReliefV2.deploy(deployer.address, await benReg.getAddress());
  await relief.waitForDeployment();
  console.log("MonadReliefV2:", await relief.getAddress());

  // Seed: mint an official and submit a claim
  const mintTx = await govReg.mintOfficial(deployer.address, "Collector", "District Collector", "Kerala/Kottayam", "+91-0000000000");
  await mintTx.wait();

  const beneficiaryId = ethers.id("KERALA_FLOOD_2026_CLAIM_1");
  const disasterId = ethers.id("KERALA_FLOOD_2026");
  const userUnique = ethers.id("AADHAAR_HASH_123");
  const docHash = ethers.id("ipfs://QmHashManifest");
  await (await benReg.submitClaim(beneficiaryId, deployer.address, disasterId, userUnique, docHash)).wait();
  await (await benReg.governmentApprove(beneficiaryId)).wait();
  // Jury: set quorum and record a yes majority
  const quorum = 3n;
  const claimId = ethers.id("KERALA_FLOOD_2026|CLAIM_1");
  await (await jury.setQuorum(claimId, quorum)).wait();
  // Skip finalize if quorum not met; guard against estimateGas revert
  try {
    const txf = await jury.finalize(claimId);
    await txf.wait();
  } catch {}
  try {
    const txr = await benReg.refreshJury(beneficiaryId, claimId);
    await txr.wait();
  } catch {}

  console.log("Seeded beneficiary:", beneficiaryId);

  // Deploy mock stablecoin and ERC20 donation router
  const MockUSD = await ethers.getContractFactory("MockUSD");
  const musd = await MockUSD.deploy(ethers.parseEther("1000000"));
  await musd.waitForDeployment();
  console.log("MockUSD:", await musd.getAddress());

  const MonadReliefERC20 = await ethers.getContractFactory("MonadReliefERC20");
  const reliefErc20 = await MonadReliefERC20.deploy(deployer.address, await benReg.getAddress(), await musd.getAddress());
  await reliefErc20.waitForDeployment();
  console.log("MonadReliefERC20:", await reliefErc20.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


