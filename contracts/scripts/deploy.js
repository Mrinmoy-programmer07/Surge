const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SurgeGaming contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "CELO\n");

  // Backend oracle address (your backend wallet)
  const BACKEND_ORACLE = process.env.BACKEND_ORACLE_ADDRESS || deployer.address;
  console.log("🔮 Backend Oracle:", BACKEND_ORACLE, "\n");

  // Deploy contract
  const SurgeGaming = await hre.ethers.getContractFactory("SurgeGaming");
  const surgeGaming = await SurgeGaming.deploy(BACKEND_ORACLE);

  await surgeGaming.waitForDeployment();

  const contractAddress = await surgeGaming.getAddress();

  console.log("✅ SurgeGaming deployed to:", contractAddress);
  console.log("🏦 Platform Wallet:", await surgeGaming.PLATFORM_WALLET());
  console.log(
    "💵 Min Stake:",
    hre.ethers.formatEther(await surgeGaming.MIN_STAKE()),
    "CELO"
  );
  console.log(
    "⏱️  Timeout:",
    (await surgeGaming.MATCH_TIMEOUT()).toString(),
    "seconds\n"
  );

  // Wait for block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await surgeGaming.deploymentTransaction().wait(5);

  // Verify contract on Celoscan
  if (process.env.CELOSCAN_API_KEY) {
    console.log("\n🔍 Verifying contract on Blockscout...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [BACKEND_ORACLE],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }

  console.log("\n📋 Contract Details:");
  console.log("=".repeat(50));
  console.log("Contract Address:", contractAddress);
  console.log("Platform Wallet:", "0xC0Aa6fb8641c2b014d86112dB098AAb17bcc9b13");
  console.log("Backend Oracle:", BACKEND_ORACLE);
  console.log("Network:", hre.network.name);
  console.log(
    "Explorer:",
    `https://celo-sepolia.blockscout.com/address/${contractAddress}`
  );
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
