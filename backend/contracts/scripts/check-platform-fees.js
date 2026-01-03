const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1";

    console.log("Checking SurgeGaming contract on Mantle Sepolia...\n");

    const SurgeGaming = await hre.ethers.getContractAt("SurgeGaming", CONTRACT_ADDRESS);

    // Get platform wallet address
    const platformWallet = await SurgeGaming.PLATFORM_WALLET();
    console.log("📍 Platform Wallet:", platformWallet);

    // Get platform fee percentage
    const feePercent = await SurgeGaming.PLATFORM_FEE_PERCENT();
    console.log("💸 Platform Fee:", Number(feePercent), "%");

    // Get accumulated fees in contract
    const accumulatedFees = await SurgeGaming.accumulatedFees();
    console.log("💰 Accumulated Fees in Contract:", hre.ethers.formatEther(accumulatedFees), "MNT");

    // Check platform wallet balance
    const platformBalance = await hre.ethers.provider.getBalance(platformWallet);
    console.log("\n📊 Platform Wallet MNT Balance:", hre.ethers.formatEther(platformBalance), "MNT");

    // Check contract balance
    const contractBalance = await hre.ethers.provider.getBalance(CONTRACT_ADDRESS);
    console.log("📊 Contract MNT Balance:", hre.ethers.formatEther(contractBalance), "MNT");

    // Check player balances
    const player1 = "0x80Af51Efc61E3f0b265380315e967d18d795beAa";
    const player2 = "0xFE13B060897b5daBbC866C312A6839C007d181fB";

    const p1Balance = await hre.ethers.provider.getBalance(player1);
    const p2Balance = await hre.ethers.provider.getBalance(player2);

    console.log("\n👤 Player 1 Balance:", hre.ethers.formatEther(p1Balance), "MNT");
    console.log("👤 Player 2 Balance:", hre.ethers.formatEther(p2Balance), "MNT");

    // Get backend oracle address
    const oracle = await SurgeGaming.backendOracle();
    console.log("\n🔐 Backend Oracle:", oracle);
}

main().catch(console.error);
