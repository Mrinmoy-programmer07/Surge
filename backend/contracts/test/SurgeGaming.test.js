const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SurgeGaming", function () {
  let surgeGaming;
  let owner, backend, player1, player2;
  const STAKE = ethers.utils.parseEther("1");
  const PLATFORM_WALLET = "0xC0Aa6fb8641c2b014d86112dB098AAb17bcc9b13";

  beforeEach(async function () {
    [owner, backend, player1, player2] = await ethers.getSigners();

    const SurgeGaming = await ethers.getContractFactory("SurgeGaming");
    surgeGaming = await SurgeGaming.deploy(backend.address);
    await surgeGaming.deployed();
  });

  describe("Match Creation", function () {
    it("Should create a match with correct stake", async function () {
      await surgeGaming
        .connect(player1)
        .createMatch("match1", { value: STAKE });

      const match = await surgeGaming.getMatch("match1");
      expect(match.player1).to.equal(player1.address);
      expect(match.stake).to.equal(STAKE);
      expect(match.status).to.equal(0); // Pending
    });

    it("Should reject stake below minimum", async function () {
      await expect(
        surgeGaming.connect(player1).createMatch("match1", {
          value: ethers.utils.parseEther("0.05"),
        })
      ).to.be.revertedWith("Stake below minimum");
    });
  });

  describe("Match Joining", function () {
    beforeEach(async function () {
      await surgeGaming
        .connect(player1)
        .createMatch("match1", { value: STAKE });
    });

    it("Should allow player2 to join with matching stake", async function () {
      await surgeGaming.connect(player2).joinMatch("match1", { value: STAKE });

      const match = await surgeGaming.getMatch("match1");
      expect(match.player2).to.equal(player2.address);
      expect(match.status).to.equal(1); // Active
    });

    it("Should reject mismatched stake", async function () {
      await expect(
        surgeGaming.connect(player2).joinMatch("match1", {
          value: ethers.utils.parseEther("2"),
        })
      ).to.be.revertedWith("Stake must match");
    });
  });

  describe("Score Submission & Winner Declaration", function () {
    beforeEach(async function () {
      await surgeGaming
        .connect(player1)
        .createMatch("match1", { value: STAKE });
      await surgeGaming.connect(player2).joinMatch("match1", { value: STAKE });
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
      expect(match.status).to.equal(2); // Completed
    });

    it("Should reject score submission from non-backend", async function () {
      await expect(
        surgeGaming.connect(player1).submitScore("match1", player1.address, 5)
      ).to.be.revertedWith("Only backend can call this");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await surgeGaming
        .connect(player1)
        .createMatch("match1", { value: STAKE });
      await surgeGaming.connect(player2).joinMatch("match1", { value: STAKE });
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
      const balanceBefore = await player1.getBalance();

      const tx = await surgeGaming.connect(player1).withdraw("match1");
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const balanceAfter = await player1.getBalance();
      const expectedPayout = STAKE.mul(2).mul(75).div(100);

      expect(balanceAfter.sub(balanceBefore).add(gasCost)).to.equal(
        expectedPayout
      );
    });

    it("Should prevent double withdrawal", async function () {
      await surgeGaming.connect(player1).withdraw("match1");

      await expect(
        surgeGaming.connect(player1).withdraw("match1")
      ).to.be.revertedWith("Already withdrawn");
    });

    it("Should accumulate platform fees", async function () {
      await surgeGaming.connect(player1).withdraw("match1");

      const expectedFee = STAKE.mul(2).mul(25).div(100);
      expect(await surgeGaming.accumulatedFees()).to.equal(expectedFee);
    });
  });

  describe("Draw Handling", function () {
    it("Should refund both players on draw", async function () {
      await surgeGaming
        .connect(player1)
        .createMatch("match1", { value: STAKE });
      await surgeGaming.connect(player2).joinMatch("match1", { value: STAKE });
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player1.address, 5);
      await surgeGaming
        .connect(backend)
        .submitScore("match1", player2.address, 5);
      await surgeGaming
        .connect(backend)
        .declareWinner("match1", player1.address);

      const match = await surgeGaming.getMatch("match1");
      expect(match.player1Score).to.equal(match.player2Score);

      // No platform fees on draw
      expect(await surgeGaming.accumulatedFees()).to.equal(0);
    });
  });
});
