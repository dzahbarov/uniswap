// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GlebToken is ERC20 {
    constructor(uint initialSupply) ERC20("GlebToken", "GLB"){
        _mint(msg.sender, initialSupply);
    }
}
