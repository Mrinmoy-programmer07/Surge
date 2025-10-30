import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import SurgeGamingABI from "../lib/abi/SurgeGaming.json";
import { SURGE_GAMING_ADDRESS } from "../lib/contracts";

export function useSurgeContract() {
  // Read contract data
  const { data: minStake } = useReadContract({
    address: SURGE_GAMING_ADDRESS as `0x${string}`,
    abi: SurgeGamingABI,
    functionName: "MIN_STAKE",
  });

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
  } = useWriteContract();

  const { isSuccess: matchCreated } = useWaitForTransactionReceipt({
    hash: createMatchHash,
  });

  const {
    writeContract: writeJoinMatch,
    data: joinMatchHash,
    isPending: isJoiningMatch,
  } = useWriteContract();

  const { isSuccess: matchJoined } = useWaitForTransactionReceipt({
    hash: joinMatchHash,
  });

  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawing,
  } = useWriteContract();

  const { isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Helper functions to call contract methods
  const createMatch = (stakeAmount: bigint) => {
    writeCreateMatch({
      address: SURGE_GAMING_ADDRESS as `0x${string}`,
      abi: SurgeGamingABI,
      functionName: "createMatch",
      value: stakeAmount,
    });
  };

  const joinMatch = (matchId: string, stakeAmount: bigint) => {
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

  return {
    // Contract state
    minStake,
    platformFeePercent,
    accumulatedFees,

    // Write functions
    createMatch,
    isCreatingMatch,
    matchCreated,
    createMatchHash,

    joinMatch,
    isJoiningMatch,
    matchJoined,
    joinMatchHash,

    withdraw,
    isWithdrawing,
    withdrawSuccess,
    withdrawHash,
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
