import { http, createConfig } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { defineChain } from 'viem'

// Define Mantle Sepolia chain with complete configuration
export const mantleSepolia = defineChain({
    id: 5003,
    name: 'Mantle Sepolia',
    nativeCurrency: {
        name: 'Mantle',
        symbol: 'MNT',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.sepolia.mantle.xyz'],
        },
        public: {
            http: ['https://rpc.sepolia.mantle.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Mantle Sepolia Explorer',
            url: 'https://sepolia.mantlescan.xyz',
        },
    },
    testnet: true,
})

export const wagmiConfig = createConfig({
    chains: [arbitrumSepolia, mantleSepolia],
    connectors: [
        injected(),
    ],
    transports: {
        // Use direct RPC URLs instead of proxies for better wallet compatibility
        [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
        [mantleSepolia.id]: http('https://rpc.sepolia.mantle.xyz'),
    },
})

// Export chain info for easy access
export const SUPPORTED_CHAINS = [arbitrumSepolia, mantleSepolia] as const
export const DEFAULT_CHAIN = arbitrumSepolia
