const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1";

    const [signer] = await hre.ethers.getSigners();
    console.log("Testing with address:", signer.address);

    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "MNT");

    const SurgeGaming = await hre.ethers.getContractAt("SurgeGaming", CONTRACT_ADDRESS);

    // Read MIN_STAKE
    try {
        const minStake = await SurgeGaming.MIN_STAKE();
        console.log("MIN_STAKE:", hre.ethers.formatEther(minStake), "MNT");
    } catch (e) {
        console.log("Error reading MIN_STAKE:", e.message);
    }

    // Try a simple deposit
    const depositId = `test_${Date.now()}`;
    console.log("\nTrying depositStake with depositId:", depositId);

    try {
        const tx = await SurgeGaming.depositStake(depositId, {
            value: hre.ethers.parseEther("0.0001"),
            gasLimit: 100000000 // 100M gas for Mantle
        });
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Deposit successful! Block:", receipt.blockNumber);
    } catch (e) {
        console.log("❌ Deposit failed:", e.message);
        if (e.data) {
            console.log("Error data:", e.data);
        }
    }
}

main().catch(console.error);
