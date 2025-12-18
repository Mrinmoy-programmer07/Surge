const hre = require("hardhat");
require('dotenv').config({ path: '.env.local' });

async function main() {
    const contractAddress = "0x8fD3A16F905dF98907B3739bCD0E31a7949cd2D2";
    const SurgeGaming = await hre.ethers.getContractFactory("SurgeGaming");
    const contract = SurgeGaming.attach(contractAddress);

    console.log("Testing depositStake...");

    // Generate random match ID
    const matchId = "test_deposit_" + Date.now();
    const stake = hre.ethers.parseEther("0.0001");

    console.log(`Depositing ${hre.ethers.formatEther(stake)} ETH for matchId: ${matchId}`);

    try {
        const tx = await contract.depositStake(matchId, { value: stake });
        console.log("Transaction sent:", tx.hash);

        await tx.wait();
        console.log("✅ Deposit confirmed!");

        // cleanup - refund to avoid locking funds forever (optional but good practice)
        console.log("Attempting refund...");
        const rf = await contract.refundStake(matchId);
        await rf.wait();
        console.log("✅ Refund confirmed!");

    } catch (error) {
        console.error("❌ Deposit failed:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
