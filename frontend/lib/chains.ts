import { defineChain } from "viem";

// NOTE: We're migrating the app to use Flow EVM Testnet (chainId 545).
// To keep imports in other files unchanged, this export keeps the same
// identifier name (`celoSepoliaTestnet`) so existing imports don't need edits.
// Replace NEXT_PUBLIC_FLOW_TESTNET_RPC with your preferred RPC endpoint.
export const celoSepoliaTestnet = defineChain({
  id: 545,
  name: "Flow EVM Testnet",
  network: "flow-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Flow EVM Testnet Token",
    symbol: "tFLOW",
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC ||
          "https://rpc.flow-testnet.example/",
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC ||
          "https://rpc.flow-testnet.example/",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Flow EVM Testnet Explorer",
      url:
        process.env.NEXT_PUBLIC_FLOW_TESTNET_EXPLORER ||
        "https://explorer.flow-testnet.example/",
    },
  },
  testnet: true,
});
