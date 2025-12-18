const hre = require("hardhat");

async function main() {
    console.log("Deploying SurgeGaming to Arbitrum Sepolia...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Use deployer as backend oracle
    const backendOracle = deployer.address;

    const SurgeGaming = await hre.ethers.getContractFactory("SurgeGaming");
    const surgeGame = await SurgeGaming.deploy(backendOracle);

    await surgeGame.waitForDeployment();

    const address = await surgeGame.getAddress();
    console.log("SurgeGaming deployed to:", address);

    console.log("To verify:");
    console.log(`npx hardhat verify --network arbitrumSepolia ${address} ${backendOracle}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
