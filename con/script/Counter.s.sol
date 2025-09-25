// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {SimpleSwapPool} from "../src/SimpleSwapPool.sol";

contract DeploySimpleSwap is Script {
    function run() external {
        // 📌 Load deployer's private key and GMON address from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address gmonToken = vm.envAddress("GMON_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // 🚀 Deploy the pool with deployer as initial owner
        SimpleSwapPool pool = new SimpleSwapPool(gmonToken, msg.sender);

        console.log("SimpleSwapPool deployed at:", address(pool));

        vm.stopBroadcast();
    }
}
