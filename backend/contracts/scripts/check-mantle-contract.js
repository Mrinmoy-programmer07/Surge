const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1";

    const [signer] = await hre.ethers.getSigners();
    console.log("Checking contract state on Mantle...");
    console.log("Address:", CONTRACT_ADDRESS);

    const SurgeGaming = await hre.ethers.getContractAt("SurgeGaming", CONTRACT_ADDRESS);

    // Check if paused
    try {
        const paused = await SurgeGaming.paused();
        console.log("Paused:", paused);
    } catch (e) {
        console.log("Error reading paused:", e.message);
    }

    // Check owner
    try {
        const owner = await SurgeGaming.owner();
        console.log("Owner:", owner);
    } catch (e) {
        console.log("Error reading owner:", e.message);
    }

    // Check backendOracle
    try {
        const backendOracle = await SurgeGaming.backendOracle();
        console.log("Backend Oracle:", backendOracle);
    } catch (e) {
        console.log("Error reading backendOracle:", e.message);
    }

    // Check MIN_STAKE
    try {
        const minStake = await SurgeGaming.MIN_STAKE();
        console.log("MIN_STAKE:", hre.ethers.formatEther(minStake));
    } catch (e) {
        console.log("Error reading MIN_STAKE:", e.message);
    }

    // Check PLATFORM_WALLET
    try {
        const platformWallet = await SurgeGaming.PLATFORM_WALLET();
        console.log("PLATFORM_WALLET:", platformWallet);
    } catch (e) {
        console.log("Error reading PLATFORM_WALLET:", e.message);
    }

    // Try to check a simple existing deposit
    try {
        const testId = "test_check";
        const exists = await SurgeGaming.depositExists(testId);
        console.log("Test deposit exists:", exists);
    } catch (e) {
        console.log("Error checking deposit:", e.message);
    }
}

main().catch(console.error);
