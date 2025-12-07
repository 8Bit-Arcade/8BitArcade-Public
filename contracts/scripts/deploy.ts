import { ethers } from "hardhat";

/**
 * Deployment Script for 8-Bit Arcade Smart Contracts
 *
 * This script deploys:
 * 1. EightBitToken (8BIT)
 * 2. GameRewards
 * 3. TournamentManager
 *
 * And automatically links them together.
 *
 * DEPLOYMENT STEPS:
 * 1. Create contracts/.env file with PRIVATE_KEY and ARBISCAN_API_KEY
 * 2. Fund your deployer wallet with Arbitrum Sepolia ETH (for testnet)
 *    Get testnet ETH from: https://faucet.quicknode.com/arbitrum/sepolia
 * 3. Run: npm run deploy:testnet
 * 4. Save the deployed contract addresses
 * 5. Update frontend/src/config/contracts.ts with the addresses
 * 6. Verify contracts on Arbiscan
 */

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("═══════════════════════════════════════════════════");
  console.log("  8-BIT ARCADE - SMART CONTRACT DEPLOYMENT");
  console.log("═══════════════════════════════════════════════════");
  console.log();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  // Deploy 8BIT Token
  console.log("📝 Deploying EightBitToken...");
  const EightBitToken = await ethers.getContractFactory("EightBitToken");
  const token = await EightBitToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ EightBitToken deployed to:", tokenAddress);
  console.log();

  // Deploy GameRewards
  console.log("📝 Deploying GameRewards...");
  const GameRewards = await ethers.getContractFactory("GameRewards");
  const rewards = await GameRewards.deploy(tokenAddress);
  await rewards.waitForDeployment();
  const rewardsAddress = await rewards.getAddress();
  console.log("✅ GameRewards deployed to:", rewardsAddress);
  console.log();

  // Deploy TournamentManager
  console.log("📝 Deploying TournamentManager...");
  const TournamentManager = await ethers.getContractFactory("TournamentManager");
  const tournaments = await TournamentManager.deploy(tokenAddress);
  await tournaments.waitForDeployment();
  const tournamentsAddress = await tournaments.getAddress();
  console.log("✅ TournamentManager deployed to:", tournamentsAddress);
  console.log();

  // Link contracts
  console.log("🔗 Linking contracts...");
  const tx = await token.setGameRewards(rewardsAddress);
  await tx.wait();
  console.log("✅ Contracts linked successfully");
  console.log();

  // Fund TournamentManager with tokens for prize pools
  // Initially mint 10M tokens to TournamentManager for prizes
  console.log("💰 Funding TournamentManager with prize pool tokens...");
  const prizePoolAmount = ethers.parseEther("10000000"); // 10M tokens
  const mintTx = await token.transfer(tournamentsAddress, prizePoolAmount);
  await mintTx.wait();
  console.log("✅ TournamentManager funded with", ethers.formatEther(prizePoolAmount), "8BIT");
  console.log();

  console.log("═══════════════════════════════════════════════════");
  console.log("  DEPLOYMENT SUMMARY");
  console.log("═══════════════════════════════════════════════════");
  console.log();
  console.log("EightBitToken (8BIT):", tokenAddress);
  console.log("GameRewards:", rewardsAddress);
  console.log("TournamentManager:", tournamentsAddress);
  console.log("Deployer:", deployer.address);
  console.log();
  console.log("⚠️  IMPORTANT NEXT STEPS:");
  console.log("───────────────────────────────────────────────────");
  console.log("1. Save these addresses in frontend/src/config/contracts.ts");
  console.log("2. Update TESTNET_CONTRACTS or MAINNET_CONTRACTS accordingly");
  console.log("3. Set rewardsDistributor in GameRewards contract:");
  console.log("   - Create a secure backend wallet");
  console.log("   - Call: rewards.setRewardsDistributor(BACKEND_WALLET)");
  console.log("4. Set tournamentManager in TournamentManager:");
  console.log("   - Call: tournaments.setTournamentManager(BACKEND_WALLET)");
  console.log("5. Verify contracts on Arbiscan:");
  console.log(`   npx hardhat verify --network arbitrumSepolia ${tokenAddress}`);
  console.log(`   npx hardhat verify --network arbitrumSepolia ${rewardsAddress} ${tokenAddress}`);
  console.log(`   npx hardhat verify --network arbitrumSepolia ${tournamentsAddress} ${tokenAddress}`);
  console.log("6. Add liquidity to DEX for 8BIT token trading");
  console.log();
  console.log("For mainnet deployment, run: npm run deploy:mainnet");
  console.log("═══════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
