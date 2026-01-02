const hre = require("hardhat");

async function main() {
    console.log("Deploying SurgeGaming to Mantle Sepolia...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Check deployer balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "MNT");

    if (balance === 0n) {
        console.error("❌ No MNT balance! Get testnet MNT from https://faucet.sepolia.mantle.xyz/");
        process.exit(1);
    }

    // Use deployer as backend oracle
    const backendOracle = deployer.address;

    const SurgeGaming = await hre.ethers.getContractFactory("SurgeGaming");
    const surgeGame = await SurgeGaming.deploy(backendOracle);

    await surgeGame.waitForDeployment();

    const address = await surgeGame.getAddress();
    console.log("✅ SurgeGaming deployed to:", address);
    console.log("📝 Chain: Mantle Sepolia (chainId: 5003)");

    console.log("\n🔧 Next steps:");
    console.log("1. Update frontend/.env.local with the new contract address");
    console.log("2. Update backend contract service with Mantle config");
    console.log("\nTo verify on Mantle Explorer:");
    console.log(`npx hardhat verify --network mantleSepolia ${address} ${backendOracle}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
