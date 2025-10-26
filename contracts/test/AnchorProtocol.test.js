const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Anchor Protocol", function () {
  let anchorFactory;
  let settlementContract;
  let tokenManager;
  let pythOracle;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy SimpleAnchorFactory
    const SimpleAnchorFactory = await ethers.getContractFactory("SimpleAnchorFactory");
    anchorFactory = await SimpleAnchorFactory.deploy();
    await anchorFactory.waitForDeployment();

    // Deploy protocol
    const result = await anchorFactory.deployProtocol();
    const settlementAddress = result[0];
    const tokenManagerAddress = result[1];
    const pythOracleAddress = result[2];
    
    // Get deployed contracts
    const SettlementContract = await ethers.getContractFactory("SettlementContract");
    const TokenManager = await ethers.getContractFactory("TokenManager");
    const PythOracle = await ethers.getContractFactory("PythOracle");
    
    settlementContract = SettlementContract.attach(settlementAddress);
    tokenManager = TokenManager.attach(tokenManagerAddress);
    pythOracle = PythOracle.attach(pythOracleAddress);
  });

  describe("Settlement Contract", function () {
    it("Should settle a batch successfully", async function () {
      const batchId = ethers.keccak256(ethers.toUtf8Bytes("test-batch-1"));
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("test-merkle-root"));
      
      const batchData = {
        batchId: batchId,
        merkleRoot: merkleRoot,
        timestamp: Math.floor(Date.now() / 1000),
        totalIntents: 2,
        isSettled: false,
        priceDataHash: ethers.keccak256(ethers.toUtf8Bytes("price-data"))
      };

      const tokens = ["ETH", "BTC"];
      const prices = [ethers.parseEther("3920"), ethers.parseEther("67000")];

      await settlementContract.settleBatch(batchData, tokens, prices);
      
      const batch = await settlementContract.getBatch(batchId);
      expect(batch.batchId).to.equal(batchId);
      expect(batch.merkleRoot).to.equal(merkleRoot);
    });

    it("Should verify Merkle proof correctly", async function () {
      // This would test the Merkle proof verification logic
      // Implementation depends on the specific proof structure
    });
  });

  describe("Pyth Oracle", function () {
    it("Should update price successfully", async function () {
      const newPrice = ethers.parseEther("4000");
      const confidence = ethers.parseEther("0.01");

      await pythOracle.updatePrice("ETH", newPrice, confidence);
      
      const price = await pythOracle.getPrice("ETH");
      expect(price).to.equal(newPrice);
    });

    it("Should reject invalid prices", async function () {
      await expect(
        pythOracle.updatePrice("ETH", 0, ethers.parseEther("0.01"))
      ).to.be.revertedWith("Invalid price");
    });
  });

  describe("Token Manager", function () {
    it("Should add supported tokens", async function () {
      const tokenAddress = "0x1234567890123456789012345678901234567890";
      
      await tokenManager.addSupportedToken("USDC", tokenAddress, 6);
      
      const tokenInfo = await tokenManager.getTokenInfo("USDC");
      expect(tokenInfo.tokenAddress).to.equal(tokenAddress);
      expect(tokenInfo.decimals).to.equal(6);
    });
  });
});
