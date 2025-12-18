import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useBalance,
} from "wagmi";
import { parseEther } from "viem";
import SurgeGamingArtifact from "../lib/abi/SurgeGaming.json";
const SurgeGamingABI = SurgeGamingArtifact.abi;
import { SURGE_GAMING_ADDRESS } from "../lib/contracts";
import { useEffect } from "react";

export function useSurgeContract() {
  const { address: userAddress } = useAccount();
  const { data: balance } = useBalance({
    address: userAddress,
  });

  // Read contract data
  const { data: minStake, error: contractReadError } = useReadContract({
    address: SURGE_GAMING_ADDRESS as `0x${string}`,
    abi: SurgeGamingABI,
    functionName: "MIN_STAKE",
  });

  // Log important info on mount
  useEffect(() => {
    console.log("🎮 Contract Configuration:", {
      contractAddress: SURGE_GAMING_ADDRESS,
      userAddress,
      balance: balance ? `${balance.formatted} ${balance.symbol}` : "N/A",
    });

    if (minStake) {
      console.log(
        "✅ Contract is deployed! MIN_STAKE:",
        Number(minStake) / 1e18 + " ETH"
      );
    } else if (contractReadError) {
      console.error(
        "❌ Contract NOT deployed or incorrect address!",
        contractReadError
      );
    }
  }, [userAddress, balance, minStake, contractReadError]);

  const { data: platformFeePercent } = useReadContract({
    address: SURGE_GAMING_ADDRESS as `0x${string}`,
    abi: SurgeGamingABI,
    functionName: "PLATFORM_FEE_PERCENT",
  });

  const { data: accumulatedFees } = useReadContract({
    address: SURGE_GAMING_ADDRESS as `0x${string}`,
    abi: SurgeGamingABI,
    functionName: "accumulatedFees",
  });

  // Write contract functions
  const {
    writeContract: writeCreateMatch,
    data: createMatchHash,
    isPending: isCreatingMatch,
    error: createMatchError,
  } = useWriteContract();

  const { isSuccess: matchCreated } = useWaitForTransactionReceipt({
    hash: createMatchHash,
  });

  // Log when match is created successfully
  useEffect(() => {
    if (matchCreated && createMatchHash) {
      console.log("✅ Match creation confirmed! Hash:", createMatchHash);
    }
  }, [matchCreated, createMatchHash]);

  const {
    writeContract: writeJoinMatch,
    data: joinMatchHash,
    isPending: isJoiningMatch,
    error: joinMatchError,
  } = useWriteContract();

  const { isSuccess: matchJoined } = useWaitForTransactionReceipt({
    hash: joinMatchHash,
  });

  // Log when match is joined successfully
  useEffect(() => {
    if (matchJoined && joinMatchHash) {
      console.log("✅ Match join confirmed! Hash:", joinMatchHash);
    }
  }, [matchJoined, joinMatchHash]);

  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawing,
  } = useWriteContract();

  const { isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const {
    writeContract: writeWithdrawDraw,
    data: withdrawDrawHash,
    isPending: isWithdrawingDraw,
  } = useWriteContract();

  const { isSuccess: withdrawDrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawDrawHash,
  });

  // Helper functions to call contract methods
  const createMatch = (matchId: string, stakeAmount: bigint) => {
    console.log("🔧 createMatch params:", {
      address: SURGE_GAMING_ADDRESS,
      matchId,
      stakeAmount: stakeAmount.toString(),
      stakeInETH: (Number(stakeAmount) / 1e18).toFixed(4) + " ETH",
    });

    if (!SURGE_GAMING_ADDRESS || SURGE_GAMING_ADDRESS === "") {
      console.error("❌ Contract address not set in environment variables!");
      throw new Error("Contract address not configured");
    }

    if (!userAddress) {
      console.error("❌ Wallet not connected!");
      throw new Error("Please connect your wallet");
    }

    if (balance && balance.value < stakeAmount) {
      console.error("❌ Insufficient balance!", {
        required: (Number(stakeAmount) / 1e18).toFixed(4) + " ETH",
        available: balance.formatted + " " + balance.symbol,
      });
      throw new Error(
        `Insufficient balance. Need ${(Number(stakeAmount) / 1e18).toFixed(
          4
        )} ETH but only have ${balance.formatted} ${balance.symbol}`
      );
    }

    writeCreateMatch({
      address: SURGE_GAMING_ADDRESS as `0x${string}`,
      abi: SurgeGamingABI,
      functionName: "depositStake",
      args: [matchId],
      value: stakeAmount,
      gas: BigInt(1000000), // High gas limit to prevent estimation errors
    });
  };

  const joinMatch = (matchId: string, stakeAmount: bigint) => {
    console.log("🔧 joinMatch params:", {
      address: SURGE_GAMING_ADDRESS,
      matchId,
      stakeAmount: stakeAmount.toString(),
      stakeInETH: (Number(stakeAmount) / 1e18).toFixed(4) + " ETH",
    });

    if (!SURGE_GAMING_ADDRESS || SURGE_GAMING_ADDRESS === "") {
      console.error("❌ Contract address not set!");
      throw new Error("Contract address not configured");
    }

    if (!userAddress) {
      console.error("❌ Wallet not connected!");
      throw new Error("Please connect your wallet");
    }

    if (balance && balance.value < stakeAmount) {
      console.error("❌ Insufficient balance!", {
        required: (Number(stakeAmount) / 1e18).toFixed(4) + " ETH",
        available: balance.formatted + " " + balance.symbol,
      });
      throw new Error(
        `Insufficient balance. Need ${(Number(stakeAmount) / 1e18).toFixed(
          4
        )} ETH but only have ${balance.formatted} ${balance.symbol}`
      );
    }

    writeJoinMatch({
      address: SURGE_GAMING_ADDRESS as `0x${string}`,
      abi: SurgeGamingABI,
      functionName: "joinMatch",
      args: [matchId],
      value: stakeAmount,
    });
  };

  const withdraw = (matchId: string) => {
    writeWithdraw({
      address: SURGE_GAMING_ADDRESS as `0x${string}`,
      abi: SurgeGamingABI,
      functionName: "withdraw",
      args: [matchId],
    });
  };

  const withdrawDraw = (matchId: string) => {
    writeWithdrawDraw({
      address: SURGE_GAMING_ADDRESS as `0x${string}`,
      abi: SurgeGamingABI,
      functionName: "withdrawDraw",
      args: [matchId],
    });
  };

  return {
    // Contract state
    minStake,
    platformFeePercent,
    accumulatedFees,

    // Write functions
    createMatch,
    depositStake: createMatch, // Alias for escrow model
    isCreatingMatch,
    matchCreated,
    createMatchHash,
    createMatchError,

    joinMatch,
    isJoiningMatch,
    matchJoined,
    joinMatchHash,
    joinMatchError,

    withdraw,
    isWithdrawing,
    withdrawSuccess,
    withdrawHash,

    withdrawDraw,
    isWithdrawingDraw,
    withdrawDrawSuccess,
    withdrawDrawHash,
  };
}

// Separate hooks for reading dynamic data
export function useMatchData(matchId: string) {
  return useReadContract({
    address: SURGE_GAMING_ADDRESS as `0x${string}`,
    abi: SurgeGamingABI,
    functionName: "getMatch",
    args: [matchId],
  });
}

export function usePlayerStats(playerAddress: string) {
  return useReadContract({
    address: SURGE_GAMING_ADDRESS as `0x${string}`,
    abi: SurgeGamingABI,
    functionName: "getPlayerStats",
    args: [playerAddress],
  });
}

export function useCalculatePayout(stakeAmount: string) {
  return useReadContract({
    address: SURGE_GAMING_ADDRESS as `0x${string}`,
    abi: SurgeGamingABI,
    functionName: "calculatePayout",
    args: [parseEther(stakeAmount)],
  });
}
