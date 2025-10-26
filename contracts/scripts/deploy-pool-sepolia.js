const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Unified Liquidity Pool to Sepolia...");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("PRIVATE_KEY set:", !!process.env.PRIVATE_KEY);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy UnifiedLiquidityPool
  console.log("📦 Deploying UnifiedLiquidityPool...");
  const UnifiedLiquidityPool = await ethers.getContractFactory("UnifiedLiquidityPool");
  const liquidityPool = await UnifiedLiquidityPool.deploy(deployer.address);
  await liquidityPool.waitForDeployment();
  
  const poolAddress = await liquidityPool.getAddress();
  console.log("✅ Unified Liquidity Pool deployed to:", poolAddress);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    poolAddress: poolAddress,
    timestamp: new Date().toISOString()
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `pool-${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("💾 Deployment info saved to:", deploymentFile);
  console.log("🎉 Pool deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
