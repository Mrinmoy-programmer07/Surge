import { createPublicClient, createWalletClient, http } from "viem";
import { celoSepoliaTestnet } from "@/lib/chains";

// NOTE: After migration this file continues to export the same symbols used
// across the app. The chain now targets Flow EVM Testnet (chainId 545).
export const publicClient = createPublicClient({
  chain: celoSepoliaTestnet,
  transport: http(celoSepoliaTestnet.rpcUrls.default.http[0]),
});

export const walletClient = createWalletClient({
  chain: celoSepoliaTestnet,
  transport: http(celoSepoliaTestnet.rpcUrls.default.http[0]),
});

export const CELO_CHAIN_ID = 545; // Now points to Flow EVM Testnet (kept name to avoid breaking imports)
// Token on Flow EVM Testnet (set via env if you have a stable token address)
export const CUSD_ADDRESS = (process.env.NEXT_PUBLIC_CUSD_ADDRESS ||
  "") as `0x${string}`;

export const CHAIN = celoSepoliaTestnet;
