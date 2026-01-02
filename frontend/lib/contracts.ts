import { CHAINS, DEFAULT_CHAIN_ID, type SupportedChainId } from './chains';

// Legacy export for backward compatibility (uses default chain)
export const SURGE_GAMING_ADDRESS =
  process.env.NEXT_PUBLIC_SURGE_GAMING_CONTRACT || CHAINS[DEFAULT_CHAIN_ID].contractAddress;

export const PLATFORM_WALLET = "0xFE13B060897b5daBbC866C312A6839C007d181fB";

// Per-chain contract addresses
export const CONTRACT_ADDRESSES: Record<SupportedChainId, string> = {
  421614: "0x8fD3A16F905dF98907B3739bCD0E31a7949cd2D2", // Arbitrum Sepolia
  5003: "0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1",   // Mantle Sepolia
};

/**
 * Get contract address for a specific chain
 * Falls back to default chain if not supported
 */
export function getContractAddressForChain(chainId: number): `0x${string}` {
  const address = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  return (address || CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID]) as `0x${string}`;
}

export const CONTRACTS = {
  surgeGaming: {
    address: SURGE_GAMING_ADDRESS,
    abi: "SurgeGaming",
  },
} as const;
