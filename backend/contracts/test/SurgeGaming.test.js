const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SurgeGaming", function () {
  let surgeGaming;
  let owner, backend, player1, player2;
  let STAKE;

  beforeEach(async function () {
    [owner, backend, player1, player2] = await ethers.getSigners();
    STAKE = ethers.parseEther("1");

    const SurgeGaming = await ethers.getContractFactory("SurgeGaming");
    surgeGaming = await SurgeGaming.deploy(backend.address);
    await surgeGaming.waitForDeployment();
  });

  describe("Stake Deposits", function () {
    it("Should deposit stake with correct amount", async function () {
      await surgeGaming
        .connect(player1)
        .depositStake("deposit1", { value: STAKE });

      const deposit = await surgeGaming.getDeposit("deposit1");
      expect(deposit.player).to.equal(player1.address);
      expect(deposit.amount).to.equal(STAKE);
      expect(deposit.refunded).to.equal(false);
    });

    it("Should reject stake below minimum", async function () {
      await expect(
        surgeGaming.connect(player1).depositStake("deposit1", {
          value: ethers.parseEther("0.00005"),
        })
      ).to.be.revertedWith("Stake below minimum");
    });

    it("Should reject duplicate deposit IDs", async function () {
      await surgeGaming
        .connect(player1)
        .depositStake("deposit1", { value: STAKE });

      await expect(
        surgeGaming.connect(player2).depositStake("deposit1", { value: STAKE })
      ).to.be.revertedWith("Deposit already exists");
    });

    it("Should allow refund for unmatched deposits", async function () {
      await surgeGaming
        .connect(player1)
        .depositStake("deposit1", { value: STAKE });

      const balanceBefore = await ethers.provider.getBalance(player1.address);

      const tx = await surgeGaming.connect(player1).refundStake("deposit1");
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player1.address);

      expect(balanceAfter - balanceBefore + gasCost).to.equal(STAKE);
    });
  });

  describe("Match Creation from Deposits", function () {
    beforeEach(async function () {
      await surgeGaming
        .connect(player1)
        .depositStake("deposit1", { value: STAKE });
      await surgeGaming
        .connect(player2)
        .depositStake("deposit2", { value: STAKE });
    });

    it("Should create match from two deposits", async function () {
      await surgeGaming
        .connect(backend)
        .createMatchFromDeposits("match1", "deposit1", "deposit2");

      const match = await surgeGaming.getMatch("match1");
      expect(match.player1).to.equal(player1.address);
      expect(match.player2).to.equal(player2.address);
      expect(match.stake).to.equal(STAKE);
      expect(match.status).to.equal(1n); // Active
    });

    it("Should reject match creation from non-backend", async function () {
      await expect(
        surgeGaming
          .connect(player1)
          .createMatchFromDeposits("match1", "deposit1", "deposit2")
      ).to.be.revertedWith("Only backend can call this");
    });

    it("Should reject match with mismatched stakes", async function () {
      // Create a deposit with different stake
      const DIFFERENT_STAKE = ethers.parseEther("2");
      await surgeGaming
        .connect(player1)
        .depositStake("deposit3", { value: DIFFERENT_STAKE });

      await expect(
        surgeGaming
          .connect(backend)
          .createMatchFromDeposits("match1", "deposit3", "deposit2")
      ).to.be.revertedWith("Stakes must match");
    });
  });

  describe("Score Submission & Winner Declaration", function () {
    beforeEach(async function () {
      await surgeGaming
        .connect(player1)
        .depositStake("deposit1", { value: STAKE });
      await surgeGaming
        .connect(player2)
        .depositStake("deposit2", { value: STAKE });
      await surgeGaming
        .connect(backend)
        .createMatchFromDeposits("match1", "deposit1", "deposit2");
    });

    it("Should allow backend to submit scores and declare winner", async function () {
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player1.address, 5);
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player2.address, 3);
      await surgeGaming
        .connect(backend)
        .declareWinner("match1", player1.address);

      const match = await surgeGaming.getMatch("match1");
      expect(match.winner).to.equal(player1.address);
      expect(match.status).to.equal(2n); // Completed
    });

    it("Should reject score submission from non-backend", async function () {
      await expect(
        surgeGaming.connect(player1).submitScore("match1", player1.address, 5)
      ).to.be.revertedWith("Only backend can call this");
    });

    it("Should handle draw correctly", async function () {
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player1.address, 5);
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player2.address, 5);
      // For draw, winner address must be zero address
      await surgeGaming
        .connect(backend)
        .declareWinner("match1", ethers.ZeroAddress);

      const match = await surgeGaming.getMatch("match1");
      expect(match.status).to.equal(4n); // Draw
      expect(match.winner).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await surgeGaming
        .connect(player1)
        .depositStake("deposit1", { value: STAKE });
      await surgeGaming
        .connect(player2)
        .depositStake("deposit2", { value: STAKE });
      await surgeGaming
        .connect(backend)
        .createMatchFromDeposits("match1", "deposit1", "deposit2");
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player1.address, 5);
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player2.address, 3);
      await surgeGaming
        .connect(backend)
        .declareWinner("match1", player1.address);
    });

    it("Should allow winner to withdraw 75% of pot", async function () {
      const balanceBefore = await ethers.provider.getBalance(player1.address);

      const tx = await surgeGaming.connect(player1).withdraw("match1");
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      const expectedPayout = (STAKE * 2n * 75n) / 100n;

      expect(balanceAfter - balanceBefore + gasCost).to.equal(expectedPayout);
    });

    it("Should send 25% to platform wallet", async function () {
      const PLATFORM_WALLET = "0xFE13B060897b5daBbC866C312A6839C007d181fB";
      const platformBalanceBefore = await ethers.provider.getBalance(
        PLATFORM_WALLET
      );

      await surgeGaming.connect(player1).withdraw("match1");

      const platformBalanceAfter = await ethers.provider.getBalance(
        PLATFORM_WALLET
      );
      const expectedFee = (STAKE * 2n * 25n) / 100n;

      expect(platformBalanceAfter - platformBalanceBefore).to.equal(
        expectedFee
      );
    });

    it("Should prevent double withdrawal", async function () {
      await surgeGaming.connect(player1).withdraw("match1");

      await expect(
        surgeGaming.connect(player1).withdraw("match1")
      ).to.be.revertedWith("Already withdrawn");
    });

    it("Should reject withdrawal by non-winner", async function () {
      await expect(
        surgeGaming.connect(player2).withdraw("match1")
      ).to.be.revertedWith("Only winner can withdraw");
    });
  });

  describe("Draw Withdrawals", function () {
    beforeEach(async function () {
      await surgeGaming
        .connect(player1)
        .depositStake("deposit1", { value: STAKE });
      await surgeGaming
        .connect(player2)
        .depositStake("deposit2", { value: STAKE });
      await surgeGaming
        .connect(backend)
        .createMatchFromDeposits("match1", "deposit1", "deposit2");
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player1.address, 5);
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player2.address, 5);
      await surgeGaming
        .connect(backend)
        .declareWinner("match1", ethers.ZeroAddress);
    });

    it("Should allow both players to withdraw their stakes on draw", async function () {
      const balance1Before = await ethers.provider.getBalance(player1.address);
      const balance2Before = await ethers.provider.getBalance(player2.address);

      const tx1 = await surgeGaming.connect(player1).withdrawDraw("match1");
      const receipt1 = await tx1.wait();
      const gasCost1 = receipt1.gasUsed * receipt1.gasPrice;

      const tx2 = await surgeGaming.connect(player2).withdrawDraw("match1");
      const receipt2 = await tx2.wait();
      const gasCost2 = receipt2.gasUsed * receipt2.gasPrice;

      const balance1After = await ethers.provider.getBalance(player1.address);
      const balance2After = await ethers.provider.getBalance(player2.address);

      expect(balance1After - balance1Before + gasCost1).to.equal(STAKE);
      expect(balance2After - balance2Before + gasCost2).to.equal(STAKE);
    });

    it("Should prevent double draw withdrawal", async function () {
      await surgeGaming.connect(player1).withdrawDraw("match1");

      await expect(
        surgeGaming.connect(player1).withdrawDraw("match1")
      ).to.be.revertedWith("Player1 already withdrawn");
    });

    it("Should reject draw withdrawal on completed (non-draw) match", async function () {
      // Create a non-draw match
      await surgeGaming
        .connect(player1)
        .depositStake("deposit3", { value: STAKE });
      await surgeGaming
        .connect(player2)
        .depositStake("deposit4", { value: STAKE });
      await surgeGaming
        .connect(backend)
        .createMatchFromDeposits("match2", "deposit3", "deposit4");
      await surgeGaming
        .connect(backend)
        .submitScore("match2", player1.address, 5);
      await surgeGaming
        .connect(backend)
        .submitScore("match2", player2.address, 3);
      await surgeGaming
        .connect(backend)
        .declareWinner("match2", player1.address);

      await expect(
        surgeGaming.connect(player1).withdrawDraw("match2")
      ).to.be.revertedWith("Match is not a draw");
    });
  });

  describe("Player Stats", function () {
    beforeEach(async function () {
      await surgeGaming
        .connect(player1)
        .depositStake("deposit1", { value: STAKE });
      await surgeGaming
        .connect(player2)
        .depositStake("deposit2", { value: STAKE });
      await surgeGaming
        .connect(backend)
        .createMatchFromDeposits("match1", "deposit1", "deposit2");
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player1.address, 5);
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player2.address, 3);
      await surgeGaming
        .connect(backend)
        .declareWinner("match1", player1.address);
    });

    it("Should track wins and losses correctly", async function () {
      const player1Stats = await surgeGaming.getPlayerStats(player1.address);
      const player2Stats = await surgeGaming.getPlayerStats(player2.address);

      expect(player1Stats.wins).to.equal(1n);
      expect(player1Stats.losses).to.equal(0n);
      expect(player2Stats.wins).to.equal(0n);
      expect(player2Stats.losses).to.equal(1n);
    });

    it("Should track total staked correctly", async function () {
      const player1Stats = await surgeGaming.getPlayerStats(player1.address);
      expect(player1Stats.totalStaked).to.equal(STAKE);
    });

    it("Should track total earnings after withdrawal", async function () {
      await surgeGaming.connect(player1).withdraw("match1");

      const player1Stats = await surgeGaming.getPlayerStats(player1.address);
      const expectedEarnings = (STAKE * 2n * 75n) / 100n;
      expect(player1Stats.totalEarnings).to.equal(expectedEarnings);
    });
  });
});
