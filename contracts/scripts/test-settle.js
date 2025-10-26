const { ethers } = require("hardhat");
const axios = require("axios");

async function main() {
  const deployment = require("../deployments/sepolia.json");
  const [signer] = await ethers.getSigners();
  
  const settlement = await ethers.getContractAt("SettlementContract", deployment.settlement);
  
  // Check ownership
  const owner = await settlement.owner();
  console.log("Contract owner:", owner);
  console.log("Current signer:", signer.address);
  console.log("Ownership match:", owner.toLowerCase() === signer.address.toLowerCase());
  
  // Submit intent
  await axios.post('http://localhost:3001/api/intent', {
    userAddress: signer.address,
    fromToken: "ETH", toToken: "BTC",
    fromChain: "ethereum", toChain: "arbitrum",
    amount: "0.1", recipient: signer.address
  });
  
  // Process batch
  const response = await axios.post('http://localhost:3001/api/batch/process');
  const batch = response.data.batchResult;
  
  const batchData = {
    batchId: ethers.id(batch.summary.batchId),
    merkleRoot: batch.summary.merkleRoot,
    timestamp: Math.floor(Date.now() / 1000),
    totalIntents: batch.summary.totalIntents,
    isSettled: false,
    priceDataHash: "test"
  };
  
  const tokens = Object.keys(batch.summary.priceData.prices);
  const prices = Object.values(batch.summary.priceData.prices).map(p => ethers.parseEther(p.toString()));
  
  try {
    const tx = await settlement.settleBatch(batchData, tokens, prices);
    console.log("Success! TX:", tx.hash);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
