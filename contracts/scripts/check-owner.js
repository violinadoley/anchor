const { ethers } = require("hardhat");

async function main() {
  const deployment = require("../deployments/sepolia.json");
  const factory = await ethers.getContractAt("SimpleAnchorFactory", deployment.factory);
  const settlement = await ethers.getContractAt("SettlementContract", deployment.settlement);
  
  console.log("Factory owner:", await factory.owner());
  console.log("Settlement owner:", await settlement.owner());
}

main().catch(console.error);
