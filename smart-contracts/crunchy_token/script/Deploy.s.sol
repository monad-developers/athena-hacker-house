// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/CrunchyToken.sol";


contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        // Get deployer's private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying CrunchyToken...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
         
        // Deploy the contract with deployer as initial owner
      CrunchyToken token = new CrunchyToken(deployer);

        vm.stopBroadcast();
        
        console.log("CrunchyToken deployed at:", address(token));
        console.log("Token name:", token.name());
        console.log("Token symbol:", token.symbol());
        console.log("Total supply:", token.totalSupply());
        console.log("Owner balance:", token.balanceOf(deployer));
        
        // Verify deployment
        require(token.totalSupply() == 100_000_000 * 10**18, "Total supply mismatch");
        require(token.balanceOf(deployer) == 100_000_000 * 10**18, "Owner balance mismatch");
        require(token.owner() == deployer, "Owner mismatch");
        
        console.log("Deployment successful and verified!");
    }
}