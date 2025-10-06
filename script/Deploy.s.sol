// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {TimedContract} from "src/TimedContract.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPK = uint256(vm.envBytes32("PRIVATE_KEY"));
        vm.startBroadcast(deployerPK);
        new TimedContract();
        vm.stopBroadcast();
    }
}


