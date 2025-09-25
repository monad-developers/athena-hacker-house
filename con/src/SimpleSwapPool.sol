// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

/// @title GMON-Native Swap (Minimal)
/// @notice Minimal x*y=k swap between native Monad currency and a single ERC20 (GMON).
///         Only swap and owner seeding/withdraw. Not production-ready.
contract SimpleSwapPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --------------------------------------
    // Events
    // --------------------------------------
    event Seeded(uint256 ethAdded, uint256 gmonAdded);
    event SwapETHForGMON(address indexed user, uint256 ethIn, uint256 gmonOut);
    event SwapGMONForETH(address indexed user, uint256 gmonIn, uint256 ethOut);
    event Withdrawn(address indexed to, uint256 ethAmount, uint256 gmonAmount);

    // --------------------------------------
    // Constants / Config
    // --------------------------------------
    IERC20 public immutable GMON;
    uint256 public constant FEE_BPS = 30; // 0.3%
    uint256 public constant FEE_DENOM = 10_000;

    // Pool reserves
    uint256 public reserveETH;  // native
    uint256 public reserveGMON; // GMON token

    constructor(address gmon, address initialOwner) Ownable(initialOwner) {
        require(gmon != address(0), "GMON_ZERO");
        GMON = IERC20(gmon);
    }

    // --------------------------------------
    // Views
    // --------------------------------------
    function getReserves() external view returns (uint256 ethReserve, uint256 gmonReserve) {
        return (reserveETH, reserveGMON);
    }

    // --------------------------------------
    // Owner seeding/withdraw
    // --------------------------------------
    function seedLiquidity(uint256 gmonAmount) external payable onlyOwner nonReentrant {
        require(msg.value > 0 && gmonAmount > 0, "ZERO_SEED");
        GMON.safeTransferFrom(msg.sender, address(this), gmonAmount);
        reserveETH += msg.value;
        reserveGMON += gmonAmount;
        emit Seeded(msg.value, gmonAmount);
    }

    function withdraw(address payable to, uint256 ethAmount, uint256 gmonAmount) external onlyOwner nonReentrant {
        if (ethAmount > 0) {
            require(ethAmount <= reserveETH, "ETH_EXCEEDS");
            reserveETH -= ethAmount;
            (bool ok, ) = to.call{value: ethAmount}("");
            require(ok, "ETH_SEND_FAIL");
        }
        if (gmonAmount > 0) {
            require(gmonAmount <= reserveGMON, "GMON_EXCEEDS");
            reserveGMON -= gmonAmount;
            GMON.safeTransfer(to, gmonAmount);
        }
        emit Withdrawn(to, ethAmount, gmonAmount);
    }

    // --------------------------------------
    // Swaps (constant product, 0.3% fee)
    // --------------------------------------
    function swapExactETHForGMON(uint256 minGMONOut) external payable nonReentrant returns (uint256 gmonOut) {
        require(msg.value > 0, "ZERO_IN");
        require(reserveETH > 0 && reserveGMON > 0, "NO_LIQ");

        uint256 amountInAfterFee = msg.value * (FEE_DENOM - FEE_BPS) / FEE_DENOM;
        gmonOut = _getAmountOut(amountInAfterFee, reserveETH, reserveGMON);
        require(gmonOut >= minGMONOut, "SLIPPAGE");

        // update reserves
        reserveETH += msg.value;
        reserveGMON -= gmonOut;

        GMON.safeTransfer(msg.sender, gmonOut);
        emit SwapETHForGMON(msg.sender, msg.value, gmonOut);
    }

    function swapExactGMONForETH(uint256 gmonIn, uint256 minETHOut) external nonReentrant returns (uint256 ethOut) {
        require(gmonIn > 0, "ZERO_IN");
        require(reserveETH > 0 && reserveGMON > 0, "NO_LIQ");

        GMON.safeTransferFrom(msg.sender, address(this), gmonIn);
        uint256 amountInAfterFee = gmonIn * (FEE_DENOM - FEE_BPS) / FEE_DENOM;
        ethOut = _getAmountOut(amountInAfterFee, reserveGMON, reserveETH);
        require(ethOut >= minETHOut, "SLIPPAGE");

        // update reserves
        reserveGMON += gmonIn;
        reserveETH -= ethOut;

        (bool ok, ) = payable(msg.sender).call{value: ethOut}("");
        require(ok, "ETH_SEND_FAIL");
        emit SwapGMONForETH(msg.sender, gmonIn, ethOut);
    }

    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256 amountOut) {
        require(reserveIn > 0 && reserveOut > 0, "NO_LIQ");
        amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
    }

    receive() external payable {}
}


