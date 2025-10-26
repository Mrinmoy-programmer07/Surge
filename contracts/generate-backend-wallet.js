const { Wallet } = require("ethers");

// Generate a new random wallet
const wallet = Wallet.createRandom();

console.log("\n🔑 NEW BACKEND ORACLE WALLET GENERATED\n");
console.log("═".repeat(60));
console.log("ADDRESS:", wallet.address);
console.log("PRIVATE KEY:", wallet.privateKey);
console.log("═".repeat(60));
console.log("\n⚠️  IMPORTANT: Save these securely!");
console.log("- Address goes in: BACKEND_ORACLE_ADDRESS");
console.log("- Private Key goes in: BACKEND_PRIVATE_KEY (root .env.local)");
console.log("- Fund this address with ~0.1 CELO for gas fees\n");
