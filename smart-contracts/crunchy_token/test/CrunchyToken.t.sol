// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "../src/CrunchyToken.sol";

contract CrunchyTokenTest is Test {
    CrunchyToken public token;
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    
    uint256 constant TOTAL_SUPPLY = 100_000_000 * 10**18;
    
    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        // Deploy contract with owner
        vm.prank(owner);
        token = new CrunchyToken(owner);
    }
    
    // ============ DEPLOYMENT TESTS ============
    
    function test_InitialDeployment() public {
        assertEq(token.name(), "CRUNCHY TOKEN");
        assertEq(token.symbol(), "CRUNCH");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), TOTAL_SUPPLY);
        assertEq(token.owner(), owner);
        assertEq(token.balanceOf(owner), TOTAL_SUPPLY);
    }
    
    function test_GetTokenInfo() public {
        (
            string memory tokenName,
            string memory tokenSymbol,
            uint256 totalSupply,
            uint8 tokenDecimals,
            string memory description
        ) = token.getTokenInfo();
        
        assertEq(tokenName, "CRUNCHY TOKEN");
        assertEq(tokenSymbol, "CRUNCH");
        assertEq(totalSupply, TOTAL_SUPPLY);
        assertEq(tokenDecimals, 18);
        assertEq(description, "A snacks token created especially for Athena Hacker House");
    }
    
    // ============ TRANSFER TESTS ============
    
    function test_BasicTransfer() public {
        uint256 transferAmount = 1000 * 10**18;
        
        vm.prank(owner);
        bool success = token.transfer(user1, transferAmount);
        
        assertTrue(success);
        assertEq(token.balanceOf(user1), transferAmount);
        assertEq(token.balanceOf(owner), TOTAL_SUPPLY - transferAmount);
    }
    
    function test_TransferInsufficientBalance() public {
        uint256 transferAmount = TOTAL_SUPPLY + 1;
        
        vm.prank(owner);
        vm.expectRevert();
        token.transfer(user1, transferAmount);
    }
    
    function test_TransferToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert();
        token.transfer(address(0), 1000);
    }
    
    // ============ APPROVAL TESTS ============
    
    function test_ApproveAndTransferFrom() public {
        uint256 approveAmount = 5000 * 10**18;
        uint256 transferAmount = 3000 * 10**18;
        
        // Owner approves user1 to spend tokens
        vm.prank(owner);
        token.approve(user1, approveAmount);
        
        assertEq(token.allowance(owner, user1), approveAmount);
        
        // user1 transfers from owner to user2
        vm.prank(user1);
        bool success = token.transferFrom(owner, user2, transferAmount);
        
        assertTrue(success);
        assertEq(token.balanceOf(user2), transferAmount);
        assertEq(token.balanceOf(owner), TOTAL_SUPPLY - transferAmount);
        assertEq(token.allowance(owner, user1), approveAmount - transferAmount);
    }
    
    function test_TransferFromInsufficientAllowance() public {
        uint256 approveAmount = 1000 * 10**18;
        uint256 transferAmount = 2000 * 10**18;
        
        vm.prank(owner);
        token.approve(user1, approveAmount);
        
        vm.prank(user1);
        vm.expectRevert();
        token.transferFrom(owner, user2, transferAmount);
    }
    
    // ============ MINTING TESTS ============
    
    function test_OwnerCanMint() public {
        uint256 mintAmount = 1000 * 10**18;
        uint256 initialSupply = token.totalSupply();
        
        vm.prank(owner);
        token.mint(user1, mintAmount);
        
        assertEq(token.balanceOf(user1), mintAmount);
        assertEq(token.totalSupply(), initialSupply + mintAmount);
    }
    
    function test_NonOwnerCannotMint() public {
        uint256 mintAmount = 1000 * 10**18;
        
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, mintAmount);
    }
    
    function test_MintToZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert();
        token.mint(address(0), 1000);
    }
    
    // ============ BURNING TESTS ============
    
    function test_BurnOwnTokens() public {
        uint256 transferAmount = 5000 * 10**18;
        uint256 burnAmount = 2000 * 10**18;
        
        // Transfer tokens to user1
        vm.prank(owner);
        token.transfer(user1, transferAmount);
        
        // user1 burns their own tokens
        vm.prank(user1);
        token.burn(burnAmount);
        
        assertEq(token.balanceOf(user1), transferAmount - burnAmount);
        assertEq(token.totalSupply(), TOTAL_SUPPLY - burnAmount);
    }
    
    function test_BurnFromWithApproval() public {
        uint256 transferAmount = 5000 * 10**18;
        uint256 approveAmount = 3000 * 10**18;
        uint256 burnAmount = 2000 * 10**18;
        
        // Transfer and approve
        vm.prank(owner);
        token.transfer(user1, transferAmount);
        
        vm.prank(user1);
        token.approve(user2, approveAmount);
        
        // user2 burns user1's tokens
        vm.prank(user2);
        token.burnFrom(user1, burnAmount);
        
        assertEq(token.balanceOf(user1), transferAmount - burnAmount);
        assertEq(token.allowance(user1, user2), approveAmount - burnAmount);
        assertEq(token.totalSupply(), TOTAL_SUPPLY - burnAmount);
    }
    
    function test_BurnInsufficientBalance() public {
        uint256 burnAmount = 1000 * 10**18;
        
        vm.prank(user1); // user1 has 0 balance
        vm.expectRevert();
        token.burn(burnAmount);
    }
    
    // ============ BATCH TRANSFER TESTS ============
    
    function test_BatchTransfer() public {
        address[] memory recipients = new address[](3);
        uint256[] memory amounts = new uint256[](3);
        
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = user3;
        
        amounts[0] = 1000 * 10**18;
        amounts[1] = 2000 * 10**18;
        amounts[2] = 3000 * 10**18;
        
        vm.prank(owner);
        token.batchTransfer(recipients, amounts);
        
        assertEq(token.balanceOf(user1), amounts[0]);
        assertEq(token.balanceOf(user2), amounts[1]);
        assertEq(token.balanceOf(user3), amounts[2]);
        
        uint256 totalTransferred = amounts[0] + amounts[1] + amounts[2];
        assertEq(token.balanceOf(owner), TOTAL_SUPPLY - totalTransferred);
    }
    
    function test_BatchTransferArraysMismatch() public {
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](3);
        
        recipients[0] = user1;
        recipients[1] = user2;
        amounts[0] = 1000;
        amounts[1] = 2000;
        amounts[2] = 3000;
        
        vm.prank(owner);
        vm.expectRevert("Arrays length mismatch");
        token.batchTransfer(recipients, amounts);
    }
    
    function test_BatchTransferZeroAddress() public {
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](2);
        
        recipients[0] = user1;
        recipients[1] = address(0); // Invalid address
        amounts[0] = 1000;
        amounts[1] = 2000;
        
        vm.prank(owner);
        vm.expectRevert("Invalid recipient address");
        token.batchTransfer(recipients, amounts);
    }
    
    function test_BatchTransferInsufficientBalance() public {
        address[] memory recipients = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        
        recipients[0] = user1;
        amounts[0] = TOTAL_SUPPLY + 1; // More than owner has
        
        vm.prank(owner);
        vm.expectRevert();
        token.batchTransfer(recipients, amounts);
    }
    
    // ============ OWNERSHIP TESTS ============
    
    function test_OwnershipTransfer() public {
        vm.prank(owner);
        token.transferOwnership(user1);
        
        assertEq(token.owner(), user1);
        
        // New owner can mint
        vm.prank(user1);
        token.mint(user2, 1000);
        assertEq(token.balanceOf(user2), 1000);
        
        // Old owner cannot mint
        vm.prank(owner);
        vm.expectRevert();
        token.mint(user3, 1000);
    }
    
    // ============ FUZZ TESTS ============
    
    function testFuzz_Transfer(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(to != owner);
        amount = bound(amount, 0, TOTAL_SUPPLY);
        
        vm.prank(owner);
        bool success = token.transfer(to, amount);
        
        assertTrue(success);
        assertEq(token.balanceOf(to), amount);
        assertEq(token.balanceOf(owner), TOTAL_SUPPLY - amount);
    }
    
    function testFuzz_Mint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        amount = bound(amount, 1, type(uint128).max); // Avoid overflow
        
        uint256 initialSupply = token.totalSupply();
        
        vm.prank(owner);
        token.mint(to, amount);
        
        assertEq(token.balanceOf(to), amount);
        assertEq(token.totalSupply(), initialSupply + amount);
    }
    
    // ============ INTEGRATION TESTS ============
    
    function test_CompleteTokenFlow() public {
        // 1. Owner transfers to user1
        vm.prank(owner);
        token.transfer(user1, 10000 * 10**18);
        
        // 2. user1 approves user2
        vm.prank(user1);
        token.approve(user2, 5000 * 10**18);
        
        // 3. user2 transfers from user1 to user3
        vm.prank(user2);
        token.transferFrom(user1, user3, 3000 * 10**18);
        
        // 4. user3 burns some tokens
        vm.prank(user3);
        token.burn(1000 * 10**18);
        
        // 5. Owner mints new tokens to user1
        vm.prank(owner);
        token.mint(user1, 2000 * 10**18);
        
        // Verify final balances
        assertEq(token.balanceOf(user1), 9000 * 10**18); // 10000 - 3000 + 2000
        assertEq(token.balanceOf(user2), 0);
        assertEq(token.balanceOf(user3), 2000 * 10**18); // 3000 - 1000
        assertEq(token.totalSupply(), TOTAL_SUPPLY + 2000 * 10**18 - 1000 * 10**18); // +2000 -1000
    }
}