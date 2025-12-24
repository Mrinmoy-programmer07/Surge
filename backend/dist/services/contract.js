"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractService = exports.ContractService = void 0;
const ethers_1 = require("ethers");
const SurgeGaming_json_1 = __importDefault(require("../abi/SurgeGaming.json"));
const CONTRACT_ADDRESS = '0x8fD3A16F905dF98907B3739bCD0E31a7949cd2D2';
const RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';
class ContractService {
    constructor() {
        this.wallet = null;
        this.provider = new ethers_1.ethers.JsonRpcProvider(RPC_URL);
        this.contract = new ethers_1.ethers.Contract(CONTRACT_ADDRESS, SurgeGaming_json_1.default.abi, this.provider);
        // Initialize wallet if private key is available
        const privateKey = process.env.BACKEND_PRIVATE_KEY;
        if (privateKey) {
            this.wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
            this.contract = this.contract.connect(this.wallet);
            console.log('✅ Contract service initialized with wallet:', this.wallet.address);
        }
        else {
            console.warn('⚠️ No BACKEND_PRIVATE_KEY found - contract writes will fail');
        }
    }
    /**
     * Create match from two deposits (called when match is found)
     */
    async createMatchFromDeposits(matchId, depositId1, depositId2) {
        if (!this.wallet) {
            throw new Error('Wallet not initialized - set BACKEND_PRIVATE_KEY');
        }
        try {
            console.log(`📝 Creating match on-chain: ${matchId}`);
            console.log(`   Deposit 1: ${depositId1}`);
            console.log(`   Deposit 2: ${depositId2}`);
            const tx = await this.contract.createMatchFromDeposits(matchId, depositId1, depositId2);
            console.log(`⏳ Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`✅ Match created on-chain! Block: ${receipt.blockNumber}`);
            return tx.hash;
        }
        catch (error) {
            console.error('❌ Failed to create match on-chain:', error.message);
            throw error;
        }
    }
    /**
     * Get deposit info
     */
    async getDeposit(depositId) {
        try {
            const deposit = await this.contract.getDeposit(depositId);
            return {
                player: deposit.player,
                amount: deposit.amount.toString(),
                depositedAt: Number(deposit.depositedAt),
                refunded: deposit.refunded,
                matchId: deposit.matchId,
            };
        }
        catch (error) {
            console.error(`❌ Failed to get deposit ${depositId}:`, error.message);
            return null;
        }
    }
}
exports.ContractService = ContractService;
exports.contractService = new ContractService();
