import { createPublicClient, createWalletClient, http } from "viem"
import { celoSepoliaTestnet } from "@/lib/chains"

export const publicClient = createPublicClient({
  chain: celoSepoliaTestnet,
  transport: http(celoSepoliaTestnet.rpcUrls.default.http[0]),
})

export const walletClient = createWalletClient({
  chain: celoSepoliaTestnet,
  transport: http(celoSepoliaTestnet.rpcUrls.default.http[0]),
})

export const CELO_CHAIN_ID = 11142220 // Celo Sepolia Testnet
// cUSD on Celo Sepolia Testnet (set via env until confirmed)
export const CUSD_ADDRESS = (process.env.NEXT_PUBLIC_CUSD_ADDRESS || "") as `0x${string}`

export const CHAIN = celoSepoliaTestnet
