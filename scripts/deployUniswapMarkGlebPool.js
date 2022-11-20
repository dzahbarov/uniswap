const { Contract } = require("ethers")
const { encodePriceSqrt } = require('../util.js')

const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: INonfungiblePositionManagerABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json')
const { abi: FactoryABI } = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json')

const POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

const MARK_TOKEN_ADDRESS = "0x103A3b128991781EE2c8db0454cA99d67b257923"
const GLEB_TOKEN_ADDRESS = "0x3D63c50AD04DD5aE394CAB562b7691DD5de7CF6f"

const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL)

async function main() {
    const [deployer] = await ethers.getSigners();

    const factoryContract = new Contract(UNISWAP_FACTORY_ADDRESS, FactoryABI, provider)
    const nonfungiblePositionManager = new Contract(POSITION_MANAGER_ADDRESS, INonfungiblePositionManagerABI, provider)

    await nonfungiblePositionManager.connect(deployer).createAndInitializePoolIfNecessary(
      MARK_TOKEN_ADDRESS,
      GLEB_TOKEN_ADDRESS,
      500,
      encodePriceSqrt(1, 1),
      { gasLimit: 5000000 }
    )

    // Get address of deployed pool
    const markGlebPoolAddress = await factoryContract.connect(deployer).getPool(MARK_TOKEN_ADDRESS, GLEB_TOKEN_ADDRESS, 500)
    console.log("Mark/Gleb pool deployed to", markGlebPoolAddress)

    // Get Mark/Gleb uniswap contract
    markGlebPoolContract = new Contract(markGlebPoolAddress, IUniswapV3PoolABI, deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });