import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useBalance,
  useChainId,
} from "wagmi";
import { parseEther } from "viem";
import SurgeGamingArtifact from "../lib/abi/SurgeGaming.json";
const SurgeGamingABI = SurgeGamingArtifact.abi;
import { getContractAddressForChain } from "../lib/contracts";
import { useEffect, useMemo } from "react";

export function useSurgeContract() {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address: userAddress,
  });

  // Get chain-aware contract address
  const contractAddress = useMemo(() => {
    return getContractAddressForChain(chainId);
  }, [chainId]);

  // Read contract data
  const { data: minStake, error: contractReadError } = useReadContract({
    address: contractAddress,
    abi: SurgeGamingABI,
    functionName: "MIN_STAKE",
  });

  // Log important info on mount
  useEffect(() => {
    console.log("🎮 Contract Configuration:", {
      chainId,
      contractAddress,
      userAddress,
      balance: balance ? `${balance.formatted} ${balance.symbol}` : "N/A",
    });

    if (minStake) {
      console.log(
        "✅ Contract is deployed! MIN_STAKE:",
        Number(minStake) / 1e18 + " MNT"
      );
    } else if (contractReadError) {
      console.error(
        "❌ Contract NOT deployed or incorrect address!",
        contractReadError
      );
    }
  }, [chainId, contractAddress, userAddress, balance, minStake, contractReadError]);

  const { data: platformFeePercent } = useReadContract({
    address: contractAddress,
    abi: SurgeGamingABI,
    functionName: "PLATFORM_FEE_PERCENT",
  });

  const { data: accumulatedFees } = useReadContract({
    address: contractAddress,
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

  // Note: joinMatch hook removed - contract now uses depositStake + createMatchFromDeposits

  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawing,
    error: withdrawError,
  } = useWriteContract();

  const { isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Log withdraw errors
  useEffect(() => {
    if (withdrawError) {
      console.error("❌ Withdraw error:", withdrawError.message);
    }
  }, [withdrawError]);

  const {
    writeContract: writeWithdrawDraw,
    data: withdrawDrawHash,
    isPending: isWithdrawingDraw,
    error: withdrawDrawError,
  } = useWriteContract();

  const { isSuccess: withdrawDrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawDrawHash,
  });

  // Log withdrawDraw errors
  useEffect(() => {
    if (withdrawDrawError) {
      console.error("❌ WithdrawDraw error:", withdrawDrawError.message);
    }
  }, [withdrawDrawError]);

  // Helper functions to call contract methods
  const createMatch = (matchId: string, stakeAmount: bigint) => {
    console.log("🔧 createMatch params:", {
      chainId,
      address: contractAddress,
      matchId,
      stakeAmount: stakeAmount.toString(),
      stakeInETH: (Number(stakeAmount) / 1e18).toFixed(4) + " MNT",
    });

    if (!contractAddress) {
      console.error("❌ Contract address not set!");
      throw new Error("Contract address not configured");
    }

    if (!userAddress) {
      console.error("❌ Wallet not connected!");
      throw new Error("Please connect your wallet");
    }

    if (balance && balance.value < stakeAmount) {
      console.error("❌ Insufficient balance!", {
        required: (Number(stakeAmount) / 1e18).toFixed(4) + " MNT",
        available: balance.formatted + " " + balance.symbol,
      });
      throw new Error(
        `Insufficient balance. Need ${(Number(stakeAmount) / 1e18).toFixed(
          4
        )} MNT but only have ${balance.formatted} ${balance.symbol}`
      );
    }

    // Mantle L2 has unusual gas requirements (~450M gas) - let it auto-estimate
    // Arbitrum Sepolia can use fixed 1M gas for faster estimation
    const txConfig: any = {
      address: contractAddress,
      abi: SurgeGamingABI,
      functionName: "depositStake",
      args: [matchId],
      value: stakeAmount,
    };

    // Only set gas limit for Arbitrum, let Mantle auto-estimate
    if (chainId !== 5003) {
      txConfig.gas = BigInt(1000000);
    }

    writeCreateMatch(txConfig);
  };

  // Note: joinMatch is no longer used in the new escrow model
  // Matches are created via backend calling createMatchFromDeposits after both players deposit

  const withdraw = (matchId: string) => {
    console.log("💰 Calling withdraw on contract:", {
      chainId,
      address: contractAddress,
      matchId,
    });

    if (!userAddress) {
      console.error("❌ Wallet not connected!");
      throw new Error("Please connect your wallet");
    }

    // Mantle needs auto gas estimation
    const txConfig: any = {
      address: contractAddress,
      abi: SurgeGamingABI,
      functionName: "withdraw",
      args: [matchId],
    };
    if (chainId !== 5003) {
      txConfig.gas = BigInt(1000000);
    }
    writeWithdraw(txConfig);
  };

  const withdrawDraw = (matchId: string) => {
    console.log("💰 Calling withdrawDraw on contract:", {
      chainId,
      address: contractAddress,
      matchId,
    });

    if (!userAddress) {
      console.error("❌ Wallet not connected!");
      throw new Error("Please connect your wallet");
    }

    // Mantle needs auto gas estimation
    const txConfig: any = {
      address: contractAddress,
      abi: SurgeGamingABI,
      functionName: "withdrawDraw",
      args: [matchId],
    };
    if (chainId !== 5003) {
      txConfig.gas = BigInt(1000000);
    }
    writeWithdrawDraw(txConfig);
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

    // Note: joinMatch removed - use depositStake + backend createMatchFromDeposits

    withdraw,
    isWithdrawing,
    withdrawSuccess,
    withdrawHash,
    withdrawError,

    withdrawDraw,
    isWithdrawingDraw,
    withdrawDrawSuccess,
    withdrawDrawHash,
    withdrawDrawError,
  };
}

// Separate hooks for reading dynamic data (chain-aware)
export function useMatchData(matchId: string) {
  const chainId = useChainId();
  const contractAddress = getContractAddressForChain(chainId);

  return useReadContract({
    address: contractAddress,
    abi: SurgeGamingABI,
    functionName: "getMatch",
    args: [matchId],
  });
}

export function usePlayerStats(playerAddress: string) {
  const chainId = useChainId();
  const contractAddress = getContractAddressForChain(chainId);

  return useReadContract({
    address: contractAddress,
    abi: SurgeGamingABI,
    functionName: "getPlayerStats",
    args: [playerAddress],
  });
}

export function useCalculatePayout(stakeAmount: string) {
  const chainId = useChainId();
  const contractAddress = getContractAddressForChain(chainId);

  return useReadContract({
    address: contractAddress,
    abi: SurgeGamingABI,
    functionName: "calculatePayout",
    args: [parseEther(stakeAmount)],
  });
}
