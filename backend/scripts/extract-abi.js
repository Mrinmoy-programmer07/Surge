/**
 * Script to extract the ABI from Hardhat artifacts and save it to a file
 * that can be committed to the repository.
 * 
 * Run: node scripts/extract-abi.js
 */

const fs = require('fs');
const path = require('path');

const artifactPath = path.join(
    __dirname,
    '../contracts/artifacts/contracts/SurgeGaming.sol/SurgeGaming.json'
);

const outputPath = path.join(__dirname, '../src/abi/SurgeGaming.json');

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // Extract just the ABI
    const abiFile = {
        abi: artifact.abi
    };

    fs.writeFileSync(outputPath, JSON.stringify(abiFile, null, 2));
    console.log('✅ ABI extracted to:', outputPath);
} catch (error) {
    console.error('❌ Failed to extract ABI:', error.message);
    process.exit(1);
}
