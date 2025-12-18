export const SURGE_GAMING_ADDRESS =
  process.env.NEXT_PUBLIC_SURGE_GAMING_CONTRACT || "0x8fD3A16F905dF98907B3739bCD0E31a7949cd2D2";

export const PLATFORM_WALLET = "0xFE13B060897b5daBbC866C312A6839C007d181fB";

export const CONTRACTS = {
  surgeGaming: {
    address: SURGE_GAMING_ADDRESS,
    abi: "SurgeGaming",
  },
} as const;
