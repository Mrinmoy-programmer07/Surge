import { ethers } from 'ethers';
import SurgeGamingABI from '../abi/SurgeGaming.json';

// Chain configurations
const CHAINS = {
    421614: { // Arbitrum Sepolia
        name: 'Arbitrum Sepolia',
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        contractAddress: '0x8fD3A16F905dF98907B3739bCD0E31a7949cd2D2',
    },
    5003: { // Mantle Sepolia
        name: 'Mantle Sepolia',
        rpcUrl: 'https://rpc.sepolia.mantle.xyz',
        contractAddress: '0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1',
    },
};

const DEFAULT_CHAIN_ID = 421614;

export class ContractService {
    private providers: Map<number, ethers.JsonRpcProvider> = new Map();
    private contracts: Map<number, ethers.Contract> = new Map();
    private wallet: ethers.Wallet | null = null;

    constructor() {
        let privateKey = process.env.BACKEND_PRIVATE_KEY;

        // Debug: Check if env var is loaded
        console.log('🔑 BACKEND_PRIVATE_KEY loaded:', privateKey ? `Yes (${privateKey.length} chars)` : 'No');

        // Add 0x prefix if missing
        if (privateKey && !privateKey.startsWith('0x')) {
            privateKey = `0x${privateKey}`;
        }

        // Initialize providers and contracts for all chains
        for (const [chainIdStr, config] of Object.entries(CHAINS)) {
            const chainId = parseInt(chainIdStr);
            const provider = new ethers.JsonRpcProvider(config.rpcUrl);
            this.providers.set(chainId, provider);

            let contract = new ethers.Contract(config.contractAddress, SurgeGamingABI.abi, provider);

            if (privateKey) {
                const wallet = new ethers.Wallet(privateKey, provider);
                contract = contract.connect(wallet) as ethers.Contract;
                if (!this.wallet) {
                    this.wallet = wallet;
                    console.log('✅ Contract service initialized with wallet:', wallet.address);
                }
            }

            this.contracts.set(chainId, contract);
            console.log(`✅ Initialized ${config.name} contract: ${config.contractAddress}`);
        }

        if (!privateKey) {
            console.warn('⚠️ No BACKEND_PRIVATE_KEY found - contract writes will fail');
        }
    }

    /**
     * Get contract for a specific chain
     */
    private getContract(chainId: number): ethers.Contract {
        const contract = this.contracts.get(chainId);
        if (!contract) {
            console.warn(`⚠️ Chain ${chainId} not supported, falling back to default`);
            return this.contracts.get(DEFAULT_CHAIN_ID)!;
        }
        return contract;
    }

    /**
     * Create match from two deposits (called when match is found)
     */
    async createMatchFromDeposits(
        matchId: string,
        depositId1: string,
        depositId2: string,
        chainId: number = DEFAULT_CHAIN_ID
    ): Promise<string> {
        if (!this.wallet) {
            throw new Error('Wallet not initialized - set BACKEND_PRIVATE_KEY');
        }

        const contract = this.getContract(chainId);
        const chainName = CHAINS[chainId as keyof typeof CHAINS]?.name || 'Unknown';

        try {
            console.log(`📝 Creating match on ${chainName} (chainId: ${chainId}): ${matchId}`);
            console.log(`   Deposit 1: ${depositId1}`);
            console.log(`   Deposit 2: ${depositId2}`);

            const tx = await contract.createMatchFromDeposits(
                matchId,
                depositId1,
                depositId2
            );

            console.log(`⏳ Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Match created on-chain! Block: ${receipt.blockNumber}`);

            return tx.hash;
        } catch (error: any) {
            console.error(`❌ Failed to create match on ${chainName}:`, error.message);
            throw error;
        }
    }

    /**
     * Get deposit info
     */
    async getDeposit(depositId: string, chainId: number = DEFAULT_CHAIN_ID) {
        const contract = this.getContract(chainId);

        try {
            const deposit = await contract.getDeposit(depositId);
            return {
                player: deposit.player,
                amount: deposit.amount.toString(),
                depositedAt: Number(deposit.depositedAt),
                refunded: deposit.refunded,
                matchId: deposit.matchId,
            };
        } catch (error: any) {
            console.error(`❌ Failed to get deposit ${depositId}:`, error.message);
            return null;
        }
    }
}

export const contractService = new ContractService();
