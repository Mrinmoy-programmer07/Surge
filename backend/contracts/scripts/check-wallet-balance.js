const hre = require("hardhat");

async function main() {
    const WALLET_ADDRESS = "0xFE13B060897b5daBbC866C312A6839C007d181fB";

    console.log("Checking wallet balance on Mantle Sepolia...");
    console.log("Wallet:", WALLET_ADDRESS);

    const balance = await hre.ethers.provider.getBalance(WALLET_ADDRESS);
    console.log("\n💰 Balance:", hre.ethers.formatEther(balance), "MNT");

    if (balance === BigInt(0)) {
        console.log("\n❌ WALLET IS EMPTY!");
        console.log("You need to send some MNT to this address to pay for gas.");
        console.log("\n📍 Get Mantle Sepolia testnet tokens from:");
        console.log("   https://faucet.sepolia.mantle.xyz/");
    } else if (balance < hre.ethers.parseEther("0.01")) {
        console.log("\n⚠️ Wallet has low balance. May not be enough for gas.");
    } else {
        console.log("\n✅ Wallet has sufficient balance.");
    }
}

main().catch(console.error);
