// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title GMON Token
/// @notice Simple ERC20 token for testing swap pool on Monad testnet
contract GMON is ERC20, Ownable {
    constructor(address initialOwner) ERC20("GMON Token", "GMON") Ownable(initialOwner) {
        // Mint initial supply to deployer (10 million GMON)
        _mint(initialOwner, 10_000_000 * 10 ** decimals());
    }

    /// @notice Owner can mint more tokens if needed
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
