const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners()
    const Token = await ethers.getContractFactory("GlebToken", deployer)
    token = await Token.deploy(100000)
    await token.deployed()
    console.log("Gleb token deployed to:", token.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });