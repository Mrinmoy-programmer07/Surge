const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1";

    const [signer] = await hre.ethers.getSigners();
    console.log("Testing with auto gas estimation on Mantle...");
    console.log("Address:", signer.address);

    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "MNT");

    const SurgeGaming = await hre.ethers.getContractAt("SurgeGaming", CONTRACT_ADDRESS);

    const depositId = `test_auto_${Date.now()}`;
    console.log("\nTrying depositStake WITHOUT specifying gas limit:");
    console.log("depositId:", depositId);

    try {
        // Don't specify gasLimit - let ethers estimate it
        const tx = await SurgeGaming.depositStake(depositId, {
            value: hre.ethers.parseEther("0.0001"),
            // NO gasLimit specified - let Mantle estimate
        });
        console.log("Transaction sent:", tx.hash);
        console.log("Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("✅ Deposit successful!");
        console.log("Block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
    } catch (e) {
        console.log("❌ Failed:", e.message);

        // If it fails, try with explicit estimation
        console.log("\n\nTrying with explicit gas estimation...");
        try {
            const estimatedGas = await SurgeGaming.depositStake.estimateGas(depositId, {
                value: hre.ethers.parseEther("0.0001"),
            });
            console.log("Estimated gas:", estimatedGas.toString());

            // Add 20% buffer
            const gasWithBuffer = estimatedGas * BigInt(120) / BigInt(100);
            console.log("Gas with 20% buffer:", gasWithBuffer.toString());
        } catch (estError) {
            console.log("Gas estimation also failed:", estError.message);
        }
    }
}

main().catch(console.error);
