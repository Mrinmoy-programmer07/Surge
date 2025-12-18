const hre = require("hardhat");

async function main() {
    const contractAddress = "0x8fD3A16F905dF98907B3739bCD0E31a7949cd2D2";
    const SurgeGaming = await hre.ethers.getContractFactory("SurgeGaming");
    const contract = SurgeGaming.attach(contractAddress);

    console.log("Checking contract state...");

    try {
        const minStake = await contract.MIN_STAKE();
        console.log("MIN_STAKE:", hre.ethers.formatEther(minStake), "ETH");

        const platformFee = await contract.PLATFORM_FEE_PERCENT();
        console.log("PLATFORM_FEE_PERCENT:", platformFee.toString(), "%");

        const paused = await contract.paused();
        console.log("Paused:", paused);

        const owner = await contract.owner();
        console.log("Owner:", owner);

    } catch (error) {
        console.error("Error reading contract:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
