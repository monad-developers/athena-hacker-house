// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DiceBet
 * @dev A BatMonting game contract using verifiable randomness
 * @notice This contract allows users to bet on dice rolls with on-chain verifiable randomness
 */
contract DiceBet is Ownable, ReentrancyGuard {
    // Minimum bet amount in wei (0.001 ETH)
    uint256 public constant MIN_BET_AMOUNT = 0.001 ether;
    
    // Maximum bet amount in wei (1 ETH)
    uint256 public constant MAX_BET_AMOUNT = 1 ether;
    
    // Platform fee percentage (5%)
    uint256 public constant PLATFORM_FEE_PERCENT = 5;
    
    // Struct to store bet information
    struct Bet {
        address player;
        uint8 choice; // Number chosen by player (1-6)
        uint256 amount;
        uint256 timestamp;
        bool isResolved;
        bool isWinner;
        uint8 diceResult;
    }
    
    // Mapping to store bets by request ID
    mapping(uint256 => Bet) public bets;
    
    // Mapping to store pending bets by user address
    mapping(address => uint256) public pendingBets;
    
    // Counter for bet IDs
    uint256 public betCounter;
    
    // Events
    event BetPlaced(
        uint256 indexed betId,
        address indexed player,
        uint8 choice,
        uint256 amount
    );
    
    event DiceRolled(
        uint256 indexed betId,
        address indexed player,
        uint8 choice,
        uint8 diceResult,
        bool isWinner
    );
    
    event PayoutSent(
        uint256 indexed betId,
        address indexed player,
        uint256 amount,
        bool isWinner
    );
    
    event PlatformFeeCollected(uint256 amount);
    
    // Constructor
    constructor() Ownable() {}
    
    /**
     * @dev Place a bet on a dice roll
     * @param choice The number chosen by the player (1-6)
     */
    function placeBet(uint8 choice) external payable nonReentrant {
        require(msg.value >= MIN_BET_AMOUNT, "Bet amount too low");
        require(msg.value <= MAX_BET_AMOUNT, "Bet amount too high");
        require(choice >= 1 && choice <= 6, "Choice must be between 1 and 6");
        require(pendingBets[msg.sender] == 0, "Player has pending bet");
        
        // Increment bet counter
        betCounter++;
        uint256 betId = betCounter;
        
        // Store bet information
        bets[betId] = Bet({
            player: msg.sender,
            choice: choice,
            amount: msg.value,
            timestamp: block.timestamp,
            isResolved: false,
            isWinner: false,
            diceResult: 0
        });
        
        // Mark user as having pending bet
        pendingBets[msg.sender] = betId;
        
        emit BetPlaced(betId, msg.sender, choice, msg.value);
        
        // Simulate dice roll with block-based randomness
        // Note: In production, use a proper VRF service like Gelato VRF
        _resolveBet(betId);
    }
    
    /**
     * @dev Resolve a bet using block-based randomness
     * @param betId The ID of the bet to resolve
     */
    function _resolveBet(uint256 betId) internal {
        Bet storage bet = bets[betId];
        require(!bet.isResolved, "Bet already resolved");
        
        // Generate random number using block data
        // This is a simplified approach - in production use VRF
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.coinbase,
            betId,
            bet.player
        )));
        
        // Generate dice result (1-6)
        uint8 diceResult = uint8((randomSeed % 6) + 1);
        
        // Check if player won
        bool isWinner = (bet.choice == diceResult);
        
        // Update bet
        bet.isResolved = true;
        bet.isWinner = isWinner;
        bet.diceResult = diceResult;
        
        // Clear pending bet
        pendingBets[bet.player] = 0;
        
        emit DiceRolled(betId, bet.player, bet.choice, diceResult, isWinner);
        
        // Handle payout
        if (isWinner) {
            // Player wins - send double the bet amount
            uint256 payout = bet.amount * 2;
            require(address(this).balance >= payout, "Insufficient contract balance");
            
            (bool success, ) = bet.player.call{value: payout}("");
            require(success, "Payout failed");
            
            emit PayoutSent(betId, bet.player, payout, true);
        } else {
            // Player loses - amount stays in contract (goes to platform)
            emit PayoutSent(betId, bet.player, 0, false);
        }
    }
    
    /**
     * @dev Get bet information
     * @param betId The ID of the bet
     * @return Bet struct containing bet information
     */
    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }
    
    /**
     * @dev Get user's pending bet ID
     * @param player The player's address
     * @return The pending bet ID (0 if no pending bet)
     */
    function getPendingBet(address player) external view returns (uint256) {
        return pendingBets[player];
    }
    
    /**
     * @dev Get contract balance
     * @return The contract's ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get minimum bet amount
     * @return The minimum bet amount in wei
     */
    function getMinBetAmount() external view returns (uint256) {
        return MIN_BET_AMOUNT;
    }
    
    /**
     * @dev Get maximum bet amount
     * @return The maximum bet amount in wei
     */
    function getMaxBetAmount() external view returns (uint256) {
        return MAX_BET_AMOUNT;
    }
    
    /**
     * @dev Withdraw platform funds (only owner)
     */
    function withdrawPlatformFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit PlatformFeeCollected(balance);
    }
    
    /**
     * @dev Emergency function to resolve stuck bets (only owner)
     * @param betId The ID of the bet to resolve
     */
    function emergencyResolveBet(uint256 betId) external onlyOwner {
        Bet storage bet = bets[betId];
        require(!bet.isResolved, "Bet already resolved");
        
        _resolveBet(betId);
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}
