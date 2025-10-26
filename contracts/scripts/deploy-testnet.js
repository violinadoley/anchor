const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Anchor Protocol to Testnet...");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("PRIVATE_KEY set:", !!process.env.PRIVATE_KEY);

  const signers = await ethers.getSigners();
  console.log("Signers count:", signers.length);
  const [deployer] = signers;
  console.log("Deployer address:", deployer ? deployer.address : "UNDEFINED");
  console.log("Deployer balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

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
      const settlementContract = parsed.args.settlementContract;
      const tokenManager = parsed.args.tokenManager;
      const pythOracle = parsed.args.pythOracle;
      const liquidityPool = parsed.args.liquidityPool;
      
      console.log("📍 Settlement Contract:", settlementContract);
      console.log("📍 Token Manager:", tokenManager);
      console.log("📍 Pyth Oracle:", pythOracle);
      console.log("📍 Liquidity Pool:", liquidityPool);
      
      // Save deployment info
      const deploymentInfo = {
        network: network.name,
        chainId: network.config.chainId,
        deployer: deployer.address,
        factory: factoryAddress,
        settlement: settlementContract,
        tokenManager: tokenManager,
        pythOracle: pythOracle,
        liquidityPool: liquidityPool,
        timestamp: new Date().toISOString(),
        txHash: receipt.hash
      };
      
      // Save to file
      const deploymentsDir = path.join(__dirname, "../deployments");
      if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
      }
      
      const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
      
      console.log("💾 Deployment info saved to:", deploymentFile);
      
      // Also save to a general deployments file
      const allDeploymentsFile = path.join(deploymentsDir, "all-deployments.json");
      let allDeployments = {};
      if (fs.existsSync(allDeploymentsFile)) {
        allDeployments = JSON.parse(fs.readFileSync(allDeploymentsFile, "utf8"));
      }
      allDeployments[network.name] = deploymentInfo;
      fs.writeFileSync(allDeploymentsFile, JSON.stringify(allDeployments, null, 2));
      
      console.log("💾 All deployments info saved to:", allDeploymentsFile);
    }
  } catch (error) {
    console.error("❌ Protocol deployment failed:", error.message);
    throw error;
  }

  console.log("🎉 Deployment completed successfully!");
  console.log("🔗 Contract addresses saved to deployments/ directory");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
