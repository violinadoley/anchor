const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Testing Anchor Protocol Deployment...");

  const [owner] = await ethers.getSigners();
  console.log("Owner address:", owner.address);

  // Deploy SimpleAnchorFactory
  console.log("📦 Deploying SimpleAnchorFactory...");
  const SimpleAnchorFactory = await ethers.getContractFactory("SimpleAnchorFactory");
  const anchorFactory = await SimpleAnchorFactory.deploy();
  await anchorFactory.waitForDeployment();
  
  const factoryAddress = await anchorFactory.getAddress();
  console.log("✅ SimpleAnchorFactory deployed to:", factoryAddress);

  // Deploy protocol
  console.log("🔧 Deploying protocol instance...");
  try {
    const tx = await anchorFactory.deployProtocol();
    const receipt = await tx.wait();
    console.log("✅ Protocol deployed successfully!");
    
    // Get the event data
    const event = receipt.logs.find(log => {
      try {
        const parsed = anchorFactory.interface.parseLog(log);
        return parsed.name === 'ProtocolDeployed';
      } catch (e) {
        return false;
      }
    });
    
    if (event) {
      const parsed = anchorFactory.interface.parseLog(event);
      console.log("📍 Settlement Contract:", parsed.args.settlementContract);
      console.log("📍 Token Manager:", parsed.args.tokenManager);
      console.log("📍 Pyth Oracle:", parsed.args.pythOracle);
    }
  } catch (error) {
    console.error("❌ Protocol deployment failed:", error.message);
  }

  console.log("🎉 Test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
