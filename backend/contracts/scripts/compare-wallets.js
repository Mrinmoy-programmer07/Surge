const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
    // Frontend private key
    const FRONTEND_PK = "0x0ba8d2df9ac94470db6d8f6f6aa3e57a8e2d83288b4e3f11c6fec34d77f62bf6";

    // Backend private key (add 0x prefix)
    const BACKEND_PK = "0x728372c8d682f74b71d140da8af851592de232a6cfaae23b5a0bb5d250eef765";

    const frontendWallet = new ethers.Wallet(FRONTEND_PK);
    const backendWallet = new ethers.Wallet(BACKEND_PK);

    console.log("🔑 Frontend wallet address:", frontendWallet.address);
    console.log("🔑 Backend wallet address:", backendWallet.address);

    const frontendBalance = await hre.ethers.provider.getBalance(frontendWallet.address);
    const backendBalance = await hre.ethers.provider.getBalance(backendWallet.address);

    console.log("\n💰 Frontend wallet balance:", hre.ethers.formatEther(frontendBalance), "MNT");
    console.log("💰 Backend wallet balance:", hre.ethers.formatEther(backendBalance), "MNT");

    if (frontendWallet.address !== backendWallet.address) {
        console.log("\n⚠️  WALLETS ARE DIFFERENT!");
        console.log("   Frontend and backend are using DIFFERENT private keys.");
        console.log("   This will cause issues - they should be the same.");
    }
}

main().catch(console.error);
