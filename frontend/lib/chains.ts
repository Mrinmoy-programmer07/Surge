/**
 * Multichain Configuration for Surge Gaming
 * Supports: Arbitrum Sepolia (default) + Mantle Sepolia
 */

export type SupportedChainId = 421614 | 5003;

export interface ChainConfig {
    id: SupportedChainId;
    name: string;
    shortName: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrl: string;
    blockExplorer: string;
    contractAddress: string;
    iconPath?: string;
}

/**
 * Chain configurations
 * Arbitrum Sepolia is the default chain
 */
export const CHAINS: Record<SupportedChainId, ChainConfig> = {
    // Arbitrum Sepolia (Default)
    421614: {
        id: 421614,
        name: 'Arbitrum Sepolia',
        shortName: 'ARB',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        blockExplorer: 'https://sepolia.arbiscan.io',
        contractAddress: '0x8fD3A16F905dF98907B3739bCD0E31a7949cd2D2',
        iconPath: '/chains/arbitrum.svg',
    },
    // Mantle Sepolia
    5003: {
        id: 5003,
        name: 'Mantle Sepolia',
        shortName: 'MNT',
        nativeCurrency: {
            name: 'Mantle',
            symbol: 'MNT',
            decimals: 18,
        },
        rpcUrl: 'https://rpc.sepolia.mantle.xyz',
        blockExplorer: 'https://sepolia.mantlescan.xyz',
        contractAddress: '0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1',
        iconPath: '/chains/mantle.svg',
    },
};

// Default chain
export const DEFAULT_CHAIN_ID: SupportedChainId = 421614;
export const DEFAULT_CHAIN = CHAINS[DEFAULT_CHAIN_ID];

// Supported chain IDs array
export const SUPPORTED_CHAIN_IDS: SupportedChainId[] = [421614, 5003];

/**
 * Get chain config by ID
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
    return CHAINS[chainId as SupportedChainId];
}

/**
 * Get contract address for a specific chain
 */
export function getContractAddress(chainId: number): string {
    const chain = getChainConfig(chainId);
    return chain?.contractAddress || DEFAULT_CHAIN.contractAddress;
}

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): chainId is SupportedChainId {
    return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

/**
 * Get all supported chains as array
 */
export function getAllChains(): ChainConfig[] {
    return Object.values(CHAINS);
}
