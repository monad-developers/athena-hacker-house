// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CRUNCHY TOKEN
 * @dev A snacks token created especially for Athena Hacker House
 * Features: Transferrable, Burnable, with 100 million total supply
 */
contract CrunchyToken is ERC20, ERC20Burnable, Ownable {
    
    // Total supply: 100 million tokens
    uint256 private constant TOTAL_SUPPLY = 100_000_000 * 10**18;
    
    /**
     * @dev Constructor that mints the total supply to the deployer
     * @param initialOwner Address that will own the contract
     */
    constructor(address initialOwner) 
        ERC20("CRUNCHY TOKEN", "CRUNCH") 
        Ownable(initialOwner) 
    {
        // Mint total supply to the initial owner
        _mint(initialOwner, TOTAL_SUPPLY);
    }
    
    /**
     * @dev Returns the number of decimals used for token display (18 by default)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    /**
     * @dev Mint new tokens - only owner can mint
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Batch transfer tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer to each recipient
     */
    function batchTransfer(address[] memory recipients, uint256[] memory amounts) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient address");
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Emergency pause function - stops all transfers (only owner)
     * Note: This requires additional implementation if needed
     */
    
    /**
     * @dev Get contract information
     */
    function getTokenInfo() external pure returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalSupply,
        uint8 tokenDecimals,
        string memory description
    ) {
        return (
            "CRUNCHY TOKEN",
            "CRUNCH", 
            TOTAL_SUPPLY,
            18,
            "A snacks token created especially for Athena Hacker House"
        );
    }
}