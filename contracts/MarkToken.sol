// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MarkToken is ERC20 {
    constructor(uint initialSupply) ERC20("MarkToken", "MRK"){
        _mint(msg.sender, initialSupply);
    }
}
