const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
    // Both should now be the SAME key (from updated frontend .env.local)
    const KEY = "0x728372c8d682f74b71d140da8af851592de232a6cfaae23b5a0bb5d250eef765";

    const wallet = new ethers.Wallet(KEY);

    console.log("🔑 Wallet address:", wallet.address);

    const balance = await hre.ethers.provider.getBalance(wallet.address);

    console.log("💰 Balance on Mantle Sepolia:", hre.ethers.formatEther(balance), "MNT");

    if (balance > 0) {
        console.log("\n✅ This wallet has funds and can pay for gas!");
    } else {
        console.log("\n❌ Wallet is EMPTY on Mantle!");
    }
}

main().catch(console.error);
