require('dotenv').config()

const { ethers } = require("hardhat");
const { Contract } = require("ethers")
const { Token } = require('@uniswap/sdk-core')
const { encodePriceSqrt, getPoolData } = require('../util.js')

const { Pool, Position, nearestUsableTick } = require('@uniswap/v3-sdk')

const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json');
const { abi: INonfungiblePositionManagerABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json')
const { abi: FactoryABI } = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json')

const SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
const POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL)

describe("Uniswap for MarkToken and GlebToken", function () {
  let markToken
  let glebToken
  let markGlebPoolContract
  let owner

  this.beforeEach(async function () {
    owner = (await hre.ethers.getSigners())[0]
    console.log("owner:", owner.address)

    // Deploy GlebToken
    const GlebToken = await hre.ethers.getContractFactory("GlebToken", owner);
    glebToken = await GlebToken.deploy(100_000);
    await glebToken.deployed();
    console.log("Gleb token deployed to:", glebToken.address);

    // Deploy MarkToken
    const MarkToken = await hre.ethers.getContractFactory("MarkToken", owner);
    markToken = await MarkToken.deploy(1_000_000);
    await markToken.deployed();
    console.log("Mark token deployed to:", markToken.address);

    // Deploy and init MarkToken/GlebToken uniswap pool
    const factoryContract = new Contract(UNISWAP_FACTORY_ADDRESS, FactoryABI, provider)
    const nonfungiblePositionManager = new Contract(POSITION_MANAGER_ADDRESS, INonfungiblePositionManagerABI, provider)

    await nonfungiblePositionManager.connect(owner).createAndInitializePoolIfNecessary(
      markToken.address,
      glebToken.address,
      500,
      encodePriceSqrt(1, 1),
      { gasLimit: 5000000 }
    )

    // Get address of deployed pool
    const markGlebPoolAddress = await factoryContract.connect(owner).getPool(markToken.address, glebToken.address, 500)
    console.log("Mark/Gleb pool deployed to", markGlebPoolAddress)

    // Get Mark/Gleb uniswap contract
    markGlebPoolContract = new Contract(markGlebPoolAddress, IUniswapV3PoolABI, owner)
  })

  it("Deploy tokens and uniswap pair", async function () {
    console.log("Deployed successfully")
  })

  it("use exactInputSingle", async function () {

    // Add liquidity to the created pool

    const initalPoolData = await getPoolData(markGlebPoolContract)
    console.log("Initial liquidity in pool:", initalPoolData.liquidity.toString())
    
    // Allow position manager take tokens from owner account 
    await glebToken.connect(owner).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther('10000000000000000'))
    await markToken.connect(owner).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther('10000000000000000'))

    // Create sdk tokens, because it needs for sdk pool
    const GlebToken = new Token(31337, glebToken.address, 18, 'GLB', 'GlebToken')
    const MarkToken = new Token(31337, markToken.address, 18, 'MRK', 'MarkToken')

    // Create sdk pool, because it needs for Position
    const pool = new Pool(
      MarkToken,
      GlebToken,
      initalPoolData.fee,
      initalPoolData.sqrtPriceX96.toString(),
      initalPoolData.liquidity.toString(),
      initalPoolData.tick
    )

    // Create new position with appropriate tick range
    const position = new Position({
      pool: pool,
      liquidity: '10000000',
      tickLower: nearestUsableTick(initalPoolData.tick - initalPoolData.tickSpacing * 2, initalPoolData.tickSpacing),
      tickUpper: nearestUsableTick(initalPoolData.tick + initalPoolData.tickSpacing * 2, initalPoolData.tickSpacing)
    })

    // Get desired amount base on new position
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

    // params for adding new position
    let params = {
      token0: markToken.address,
      token1: glebToken.address,
      fee: initalPoolData.fee,
      tickLower: nearestUsableTick(initalPoolData.tick - initalPoolData.tickSpacing * 2, initalPoolData.tickSpacing),
      tickUpper: nearestUsableTick(initalPoolData.tick + initalPoolData.tickSpacing * 2, initalPoolData.tickSpacing),
      amount0Desired: amount0Desired.toString(),
      amount1Desired: amount1Desired.toString(),
      amount0Min: 0,
      amount1Min: 0,
      recipient: owner.address,
      deadline: Math.floor(Date.now() / 1000) + (60 * 10)
    }

    const nonfungiblePositionManager = new Contract(POSITION_MANAGER_ADDRESS, INonfungiblePositionManagerABI, provider)

    console.log("Gleb tokens on owner account before adding liquidity:", (await glebToken.balanceOf(owner.address)).toString())
    console.log("Mark tokens on owner account before adding liquidity:", (await markToken.balanceOf(owner.address)).toString())

    // transaction with adding liquidity
    await nonfungiblePositionManager.connect(owner).mint(params, { gasLimit: '1000000' })

    console.log("Gleb tokens on owner account after adding liquidity:", (await glebToken.balanceOf(owner.address)).toString())
    console.log("Mark tokens on owner account after adding liquidity:", (await markToken.balanceOf(owner.address)).toString())

    const poolData = await getPoolData(markGlebPoolContract)
    console.log("Liquidity in pool after adding liquidity tx: ", poolData.liquidity.toString())

    
    // Now we can make a swap!

    // Get swapRouterConract for swapping
    const swapRouterContract = new Contract(SWAP_ROUTER_ADDRESS, SwapRouterABI, provider)

    // 100 glebToken -> x markToken

    const amountIn = 10_000

    // Allow SwapRouter to get GlebTokens from owner account
    await glebToken.connect(owner).approve(SWAP_ROUTER_ADDRESS, (amountIn * 1000).toString())

    // params for swapping
    params = {
      tokenIn: glebToken.address,
      tokenOut: markToken.address,
      fee: poolData.fee,
      recipient: owner.address,
      deadline: Math.floor(Date.now() / 1000) + (60 * 10),
      amountIn: amountIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    }

    console.log("Amount of glebToken on owner account before swap:", (await glebToken.balanceOf(owner.address)).toString())
    console.log("Amount of markToken on owner account before swap:", (await markToken.balanceOf(owner.address)).toString())
    
    console.log("Swap exactly 10000 gleb tokens to mark tokens")

    // exec tx with swapping glebToken -> markToken
    await swapRouterContract.connect(owner).exactInputSingle(params, { gasLimit: ethers.utils.hexlify(1000000) })

    console.log("Amount of glebToken on owner account after swap:", (await glebToken.balanceOf(owner.address)).toString())
    console.log("Amount of markToken on owner account after swap:", (await markToken.balanceOf(owner.address)).toString())
  })
})
