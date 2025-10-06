// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {TimedContract} from "src/TimedContract.sol";

contract TimedContractTest is Test {
    TimedContract internal timed;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        timed = new TimedContract();
    }

    function testResetRegistersAndSetsInitial() public {
        timed.reset(alice);
        assertEq(uint(timed.state(alice)), uint(TimedContract.AccountState.INITIAL));
        assertGt(timed.lastChanged(alice), 0);
        assertEq(timed.totalAccounts(), 1);
    }

    function testUpdateAfterTenMinutes() public {
        timed.reset(alice);
        timed.reset(bob);

        // advance time less than threshold, should not update
        vm.warp(block.timestamp + 9 minutes);
        timed.update();
        assertEq(uint(timed.state(alice)), uint(TimedContract.AccountState.INITIAL));
        assertEq(uint(timed.state(bob)), uint(TimedContract.AccountState.INITIAL));

        // advance past threshold
        vm.warp(block.timestamp + 2 minutes);
        timed.update();
        assertEq(uint(timed.state(alice)), uint(TimedContract.AccountState.UPDATED));
        assertEq(uint(timed.state(bob)), uint(TimedContract.AccountState.UPDATED));
    }

    function testUpdateCursorRollsOver() public {
        // Register more than MAX_TO_PROCESS to exercise cursor
        uint256 n = timed.MAX_TO_PROCESS() + 3;
        for (uint256 i = 0; i < n; i++) {
            timed.reset(address(uint160(i + 1)));
        }
        vm.warp(block.timestamp + 11 minutes);
        // first call processes MAX_TO_PROCESS accounts
        timed.update();
        // second call continues from cursor, should finish the rest
        timed.update();
        // spot check a few
        assertEq(uint(timed.state(address(1))), uint(TimedContract.AccountState.UPDATED));
        assertEq(uint(timed.state(address(uint160(n)))), uint(TimedContract.AccountState.UPDATED));
    }
}


