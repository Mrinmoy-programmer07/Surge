const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xd0EfF6d74e6E9e4F3685a382eE8Eea0F1280c2Aa";

  console.log("🔍 Checking contract at:", contractAddress);

  // Check contract balance
  const balance = await ethers.provider.getBalance(contractAddress);
  console.log("💰 Contract Balance:", ethers.formatEther(balance), "CELO");

  // Get contract instance
  const SurgeGaming = await ethers.getContractAt(
    "SurgeGaming",
    contractAddress
  );

  // Check platform wallet
  const platformWallet = await SurgeGaming.platformWallet();
  console.log("🏦 Platform Wallet:", platformWallet);

  // Check accumulated fees
  const fees = await SurgeGaming.accumulatedFees();
  console.log("💵 Accumulated Fees:", ethers.formatEther(fees), "CELO");

  // Check minimum stake
  const minStake = await SurgeGaming.MIN_STAKE();
  console.log("📊 Minimum Stake:", ethers.formatEther(minStake), "CELO");

  // Check platform fee percentage
  const feePercent = await SurgeGaming.PLATFORM_FEE_PERCENT();
  console.log("📈 Platform Fee:", feePercent.toString(), "%");

  console.log("\n✅ Contract check complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
