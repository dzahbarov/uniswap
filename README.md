# Uniswap 

## Run tests

1. In the file .env specify your alchemy url
```
ALCHEMY_URL=<URL>
```
2. run tests
```
    npx hardhat test
```



## swap test output
``` 
owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Gleb token deployed to: 0x2538a10b7fFb1B78c890c870FC152b10be121f04
Mark token deployed to: 0x24432a08869578aAf4d1eadA12e1e78f171b1a2b
Mark/Gleb pool deployed to 0x053eE91A6302890ACa337e04554c6c8Be4D2B3Cb
Initial liquidity in pool: 0
Gleb tokens on owner account before adding liquidity: 100000
Mark tokens on owner account before adding liquidity: 1000000
Gleb tokens on owner account after adding liquidity: 90005
Mark tokens on owner account after adding liquidity: 990005
Liquidity in pool after adding liquidity tx:  10000498
Amount of glebToken on owner account before swap: 90005
Amount of markToken on owner account before swap: 990005
Swap exactly 10000 gleb tokens to mark tokens
Amount of glebToken on owner account after swap: 80005
Amount of markToken on owner account after swap: 999990
    ✔ use exactInputSingle (3113ms)
```

## Local deployment
There are also scripts for deployment tokens and uniswap pair.

1. In the file .env specify your alchemy url
```
ALCHEMY_URL=<URL>
```
2. Create local node
```
npx hardhat node
```
2. Run 
```
npx hardhat run scripts/deployGlebToken.js --network local // deploy glebToken
npx hardhat run scripts/deployMarkToken.js --network local // deploy markToken
```
3. Specify deployd addresses of glebToken and markToken in scripts/deployUniswapMarkGlebPool.js 
```
const MARK_TOKEN_ADDRESS = "<ADDRESS_OF_DEPLOYED_CONTRACT>"
const GLEB_TOKEN_ADDRESS = "<ADDRESS_OF_DEPLOYED_CONTRACT>"
```
4. Run
```
npx hardhat run scripts/deployUniswapMarkGlebPool.js --network local
```