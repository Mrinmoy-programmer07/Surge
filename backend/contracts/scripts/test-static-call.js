const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x6bFe0C83f7924d54A0780F80d2B4561CfbC0B2B1";

    const [signer] = await hre.ethers.getSigners();
    console.log("Testing with address:", signer.address);

    const SurgeGaming = await hre.ethers.getContractAt("SurgeGaming", CONTRACT_ADDRESS);

    const depositId = `test_static_${Date.now()}`;
    console.log("Testing depositStake with staticCall for depositId:", depositId);

    try {
        // Use staticCall to simulate without sending tx
        await SurgeGaming.depositStake.staticCall(depositId, {
            value: hre.ethers.parseEther("0.0001"),
        });
        console.log("✅ Static call succeeded - deposit should work");
    } catch (e) {
        console.log("❌ Static call failed!");
        console.log("Error reason:", e.reason);
        console.log("Error message:", e.message);
        if (e.data) {
            try {
                const iface = SurgeGaming.interface;
                const decoded = iface.parseError(e.data);
                console.log("Decoded error:", decoded);
            } catch (decodeErr) {
                console.log("Raw error data:", e.data);
            }
        }
    }
}

main().catch(console.error);
