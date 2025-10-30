export const SURGE_GAMING_ADDRESS =
  process.env.NEXT_PUBLIC_SURGE_GAMING_CONTRACT || "";

export const PLATFORM_WALLET = "0xC0Aa6fb8641c2b014d86112dB098AAb17bcc9b13";

export const CONTRACTS = {
  surgeGaming: {
    address: SURGE_GAMING_ADDRESS,
    abi: "SurgeGaming",
  },
} as const;
