const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1";
    const MATCH_ID = "match_1767431659453_j2yfgmhuk";  // Latest match

    console.log("Checking match withdrawal status...\n");

    const SurgeGaming = await hre.ethers.getContractAt("SurgeGaming", CONTRACT_ADDRESS);

    try {
        const match = await SurgeGaming.getMatch(MATCH_ID);
        const statusNames = ["Pending", "Active", "Completed", "Cancelled", "Draw"];

        console.log("📋 Match:", MATCH_ID);
        console.log("   Status:", statusNames[Number(match.status)]);
        console.log("   Player 1:", match.player1);
        console.log("   Player 2:", match.player2);
        console.log("   Stake:", hre.ethers.formatEther(match.stake), "MNT per player");
        console.log("   Total Pot:", hre.ethers.formatEther(match.stake * BigInt(2)), "MNT");
        console.log("   Winner:", match.winner);
        console.log("   Player 1 Withdrawn:", match.player1Withdrawn);
        console.log("   Player 2 Withdrawn:", match.player2Withdrawn);

        // Calculate expected payout
        const totalPot = match.stake * BigInt(2);
        const platformFee = totalPot * BigInt(25) / BigInt(100);
        const winnerPayout = totalPot - platformFee;

        console.log("\n💰 Expected Payout Breakdown:");
        console.log("   Total Pot:", hre.ethers.formatEther(totalPot), "MNT");
        console.log("   Platform Fee (25%):", hre.ethers.formatEther(platformFee), "MNT");
        console.log("   Winner Receives (75%):", hre.ethers.formatEther(winnerPayout), "MNT");

        // Check if winner withdrew
        const isPlayer1 = match.winner === match.player1;
        const winnerWithdrew = isPlayer1 ? match.player1Withdrawn : match.player2Withdrawn;

        if (winnerWithdrew) {
            console.log("\n✅ WINNER HAS WITHDRAWN!");
            console.log("   Winner", match.winner, "received", hre.ethers.formatEther(winnerPayout), "MNT");
        } else if (Number(match.status) === 2) {
            console.log("\n⏳ Match completed but winner hasn't withdrawn yet");
        } else {
            console.log("\n⚠️ Match is still in progress (status:", statusNames[Number(match.status)], ")");
        }

    } catch (e) {
        console.log("❌ Error reading match:", e.message);
    }
}

main().catch(console.error);
