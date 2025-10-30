const hre = require("hardhat");

async function main() {
  // Hardcoded match ID - change this to the match you want to check
  const matchId = "match_1761848835229_7vzisfis2";

  const contractAddress = "0xD54097c4ceaA70c1446f9cbc6Fd7Ff5A4FA5235D";

  console.log(`\n🔍 Checking match: ${matchId}`);
  console.log(`📍 Contract: ${contractAddress}\n`);

  const SurgeGaming = await hre.ethers.getContractAt(
    "SurgeGaming",
    contractAddress
  );

  try {
    const match = await SurgeGaming.getMatch(matchId);

    const statusNames = ["Pending", "Active", "Completed", "Cancelled", "Draw"];

    console.log("📋 Match Details:");
    console.log("=".repeat(50));
    console.log(`Match ID: ${match.matchId}`);
    console.log(`Player 1: ${match.player1}`);
    console.log(`Player 2: ${match.player2}`);
    console.log(`Stake: ${hre.ethers.formatEther(match.stake)} CELO`);
    console.log(`Player 1 Score: ${match.player1Score}`);
    console.log(`Player 2 Score: ${match.player2Score}`);
    console.log(`Winner: ${match.winner}`);
    console.log(`Status: ${statusNames[match.status]} (${match.status})`);
    console.log(
      `Created At: ${new Date(Number(match.createdAt) * 1000).toLocaleString()}`
    );
    console.log(
      `Expires At: ${new Date(Number(match.expiresAt) * 1000).toLocaleString()}`
    );
    console.log(`Player 1 Withdrawn: ${match.player1Withdrawn}`);
    console.log(`Player 2 Withdrawn: ${match.player2Withdrawn}`);
    console.log("=".repeat(50));

    // Calculate expected payout
    if (match.status === 2) {
      // Completed
      const totalPot = match.stake * 2n;
      const platformFee = (totalPot * 25n) / 100n;
      const payout = totalPot - platformFee;
      console.log(`\n💰 Payout Info:`);
      console.log(`Total Pot: ${hre.ethers.formatEther(totalPot)} CELO`);
      console.log(
        `Platform Fee (25%): ${hre.ethers.formatEther(platformFee)} CELO`
      );
      console.log(
        `Winner Payout (75%): ${hre.ethers.formatEther(payout)} CELO`
      );
    } else if (match.status === 4) {
      // Draw
      console.log(
        `\n💰 Draw - Each player gets: ${hre.ethers.formatEther(
          match.stake
        )} CELO`
      );
    }
  } catch (error) {
    console.error("❌ Error reading match:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
