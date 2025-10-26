const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Anchor Protocol Contracts...");

  // Get the contract factories
  const AnchorFactory = await ethers.getContractFactory("AnchorFactory");
  
  // Deploy the factory
  console.log("📦 Deploying AnchorFactory...");
  const anchorFactory = await AnchorFactory.deploy();
  await anchorFactory.waitForDeployment();
  
  const factoryAddress = await anchorFactory.getAddress();
  console.log("✅ AnchorFactory deployed to:", factoryAddress);

  // Deploy a complete protocol instance
  console.log("🔧 Deploying protocol instance...");
  const protocolConfig = await anchorFactory.deployProtocol();
  
  console.log("✅ Protocol deployed successfully!");
  console.log("📍 Settlement Contract:", protocolConfig.settlementContract);
  console.log("📍 Token Manager:", protocolConfig.tokenManager);
  console.log("📍 Pyth Oracle:", protocolConfig.pythOracle);

  // Configure the protocol with test token addresses
  console.log("⚙️  Configuring protocol...");
  
  // Mock token addresses for testing (replace with real addresses)
  const tokenAddresses = [
    "0x1234567890123456789012345678901234567890", // USDC
    "0x2345678901234567890123456789012345678901", // USDT
    "0x3456789012345678901234567890123456789012", // ETH
    "0x4567890123456789012345678901234567890123"  // BTC
  ];
  
  const tokenSymbols = ["USDC", "USDT", "ETH", "BTC"];
  
  await anchorFactory.configureProtocol(
    protocolConfig.settlementContract,
    tokenAddresses,
    tokenSymbols
  );

  console.log("✅ Protocol configured successfully!");

  // Get protocol statistics
  const stats = await anchorFactory.getProtocolStatistics();
  console.log("\n📊 Protocol Statistics:");
  console.log("   Total Settlement Contracts:", stats.totalSettlementContracts.toString());
  console.log("   Total Token Managers:", stats.totalTokenManagers.toString());
  console.log("   Total Pyth Oracles:", stats.totalPythOracles.toString());
  console.log("   Active Protocols:", stats.activeProtocols.toString());
  console.log("   Supported Tokens:", stats.supportedTokensCount.toString());

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("   Factory:", factoryAddress);
  console.log("   Settlement:", protocolConfig.settlementContract);
  console.log("   Token Manager:", protocolConfig.tokenManager);
  console.log("   Pyth Oracle:", protocolConfig.pythOracle);

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    factory: factoryAddress,
    protocol: {
      settlement: protocolConfig.settlementContract,
      tokenManager: protocolConfig.tokenManager,
      pythOracle: protocolConfig.pythOracle
    },
    deployedAt: new Date().toISOString()
  };

  console.log("\n💾 Deployment info saved to deployment-info.json");
  
  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
