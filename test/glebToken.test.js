const { ethers } = require("hardhat");

describe("GlebToken", function () {
    this.beforeEach(async function() {
      [owner] = await ethers.getSigners()
      const Token = await ethers.getContractFactory("GlebToken", owner)
      token = await Token.deploy(100000)
      await token.deployed()
    })
  
    it("ShouldBeDeployed", async function() {
      console.log("Deployed successfully!")
    })
});
  
  