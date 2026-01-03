const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1";
    const MATCH_ID = "match_1767431659453_j2yfgmhuk";

    console.log("Checking match state on Mantle Sepolia...");
    console.log("Contract:", CONTRACT_ADDRESS);
    console.log("Match ID:", MATCH_ID);

    const SurgeGaming = await hre.ethers.getContractAt("SurgeGaming", CONTRACT_ADDRESS);

    try {
        const matchExists = await SurgeGaming.matchExists(MATCH_ID);
        console.log("\n📋 Match exists:", matchExists);

        if (!matchExists) {
            console.log("❌ MATCH DOES NOT EXIST ON THIS CONTRACT!");
            return;
        }

        const match = await SurgeGaming.getMatch(MATCH_ID);
        const statusNames = ["Pending", "Active", "Completed", "Cancelled", "Draw"];

        console.log("\n📊 Match Details:");
        console.log("  Player 1:", match.player1);
        console.log("  Player 2:", match.player2);
        console.log("  Stake:", hre.ethers.formatEther(match.stake), "MNT");
        console.log("  Player 1 Score:", Number(match.player1Score));
        console.log("  Player 2 Score:", Number(match.player2Score));
        console.log("  Status:", statusNames[Number(match.status)] || match.status);
        console.log("  Winner:", match.winner);
        console.log("  Player 1 Withdrawn:", match.player1Withdrawn);
        console.log("  Player 2 Withdrawn:", match.player2Withdrawn);

        // Diagnosis
        console.log("\n🔍 DIAGNOSIS:");
        if (Number(match.status) === 2) {
            console.log("✅ Match is COMPLETED! Winner can withdraw.");
            if (match.winner !== "0x0000000000000000000000000000000000000000") {
                console.log("   Winner address:", match.winner);
            }
        } else if (Number(match.status) === 1) {
            console.log("⚠️ Match is still ACTIVE. declareWinner needs to be called.");
        } else if (Number(match.status) === 4) {
            console.log("🤝 Match is a DRAW. Both players can withdraw their stake.");
        } else {
            console.log("❌ Match status is:", statusNames[Number(match.status)]);
        }

    } catch (e) {
        console.log("❌ Error reading match:", e.message);
    }
}

main().catch(console.error);
