const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Simple Anchor Protocol Test", function () {
  let anchorFactory;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Deploy SimpleAnchorFactory
    const SimpleAnchorFactory = await ethers.getContractFactory("SimpleAnchorFactory");
    anchorFactory = await SimpleAnchorFactory.deploy();
    await anchorFactory.waitForDeployment();
  });

  describe("Factory Deployment", function () {
    it("Should deploy factory successfully", async function () {
      expect(anchorFactory).to.not.be.undefined;
      expect(await anchorFactory.getAddress()).to.not.be.undefined;
    });

    it("Should deploy protocol successfully", async function () {
      const result = await anchorFactory.deployProtocol();
      
      expect(result[0]).to.not.be.undefined; // settlement contract
      expect(result[1]).to.not.be.undefined; // token manager
      expect(result[2]).to.not.be.undefined; // pyth oracle
      
      console.log("Deployed addresses:");
      console.log("Settlement:", result[0]);
      console.log("Token Manager:", result[1]);
      console.log("Pyth Oracle:", result[2]);
    });
  });
});
