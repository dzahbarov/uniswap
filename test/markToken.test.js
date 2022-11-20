const { ethers } = require("hardhat");

describe("MarkToken", function () {
    this.beforeEach(async function() {
      [owner] = await ethers.getSigners()
      const Token = await ethers.getContractFactory("MarkToken", owner)
      token = await Token.deploy(10000)
      await token.deployed()
    })
  
    it("ShouldBeDeployed", async function() {
      console.log("Deployed successfully!")
    })
});