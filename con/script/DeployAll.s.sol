// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {GMON} from "../src/GMON.sol";
import {SimpleSwapPool} from "../src/SimpleSwapPool.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy GMON token (deployer is initial owner)
        GMON gmon = new GMON(msg.sender);
        console.log("GMON deployed at:", address(gmon));

        // 2. Deploy Swap Pool (using GMON address)
        SimpleSwapPool pool = new SimpleSwapPool(address(gmon), msg.sender);
        console.log("impleSwapPool deployed at:", address(pool));

        vm.stopBroadcast();
    }
}
