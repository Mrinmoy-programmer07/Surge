const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1";

    const [signer] = await hre.ethers.getSigners();
    console.log("Testing actual deposit with address:", signer.address);

    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "MNT");

    const SurgeGaming = await hre.ethers.getContractAt("SurgeGaming", CONTRACT_ADDRESS);

    const depositId = `test_real_${Date.now()}`;
    console.log("\nTrying actual depositStake with depositId:", depositId);

    try {
        // Get gas price from network
        const feeData = await hre.ethers.provider.getFeeData();
        console.log("Gas price:", hre.ethers.formatUnits(feeData.gasPrice || 0, "gwei"), "gwei");
        console.log("Max fee:", hre.ethers.formatUnits(feeData.maxFeePerGas || 0, "gwei"), "gwei");

        const tx = await SurgeGaming.depositStake(depositId, {
            value: hre.ethers.parseEther("0.0001"),
            gasLimit: 100000000,
            // Let ethers handle gas price automatically
        });
        console.log("Transaction sent:", tx.hash);
        console.log("Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("✅ Deposit successful!");
        console.log("Block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        console.log("Status:", receipt.status);
    } catch (e) {
        console.log("❌ Deposit failed!");
        console.log("Error:", e.message);
        if (e.receipt) {
            console.log("Receipt status:", e.receipt.status);
            console.log("Gas used:", e.receipt.gasUsed?.toString());
        }
    }
}

main().catch(console.error);
