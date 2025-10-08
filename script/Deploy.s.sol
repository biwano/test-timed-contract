// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {TimedContract} from "src/TimedContract.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        
        // Deploy with CREATE2 to get deterministic address
        bytes32 salt = keccak256("TimedContract-v1");
        TimedContract timedContract = new TimedContract{salt: salt}();
        
        console.log("TimedContract deployed at:", address(timedContract));
        
        vm.stopBroadcast();
    }
}


