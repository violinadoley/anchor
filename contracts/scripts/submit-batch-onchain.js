const { ethers } = require("hardhat");
const axios = require("axios");

async function main() {
  console.log("🔗 Connecting to deployed contracts...");
  
  // Load deployment info
  const deployment = require("../deployments/sepolia.json");
  console.log("📍 Settlement Contract:", deployment.settlement);
  
  // Get contract instances
  const [deployer] = await ethers.getSigners();
  const settlementContract = await ethers.getContractAt(
    "SettlementContract",
    deployment.settlement,
    deployer
  );
  
  console.log("📍 Settlement Contract:", deployment.settlement);
  
  console.log("\n📊 Getting all intents from batch engine...");
  
  // Get all intents and process them
  try {
    const response = await axios.get('http://localhost:3001/api/intents');
    
    if (!response.data.success || response.data.intents.length === 0) {
      console.log("❌ No intents found");
      return;
    }
    
    const pendingIntents = response.data.intents.filter(i => i.status === 'pending');
    
    if (pendingIntents.length === 0) {
      console.log("❌ No pending intents to process");
      return;
    }
    
    console.log("✅ Found", pendingIntents.length, "pending intents. Processing...");
    const processResponse = await axios.post('http://localhost:3001/api/batch/process');
    
    if (!processResponse.data.success || !processResponse.data.batchResult) {
      console.log("❌ No batch to process");
      return;
    }
    
    const batch = processResponse.data.batchResult;
    const { batchId, merkleRoot, priceData, totalIntents } = batch.summary;
    
    console.log("\n✅ Batch fetched successfully:");
    console.log("   Batch ID:", batchId);
    console.log("   Merkle Root:", merkleRoot);
    console.log("   Total Intents:", totalIntents);
    console.log("   Prices:", priceData.prices);
    
    // Prepare batch data - order matters for struct encoding
    const batchData = [
      ethers.id(batchId),           // batchId
      merkleRoot,                   // merkleRoot
      Math.floor(Date.now() / 1000), // timestamp
      totalIntents,                 // totalIntents
      false,                        // isSettled
      ethers.id(JSON.stringify(priceData.prices)) // priceDataHash
    ];
    
    // Prepare price arrays
    const tokens = Object.keys(priceData.prices);
    const prices = Object.values(priceData.prices).map(p => {
      // Round to 8 decimal places to avoid precision issues
      const roundedPrice = parseFloat(p.toFixed(8));
      return ethers.parseUnits(roundedPrice.toString(), 8);
    });
    
    console.log("\n🔐 Submitting batch to blockchain...");
    console.log("   Tokens:", tokens);
    console.log("   Scaled prices:", prices);
    
    // Submit directly to settlement contract
    console.log("🔐 Submitting batch to blockchain...");
    
    const tx = await settlementContract.settleBatch(
      batchData,
      tokens,
      prices,
      { gasLimit: 500000 }
    );
    
    console.log("   Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("   ✅ Batch settled successfully!");
    console.log("   Gas used:", receipt.gasUsed.toString());
    
    console.log("\n🎉 Batch submitted and verified on-chain!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("   API response:", error.response.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
