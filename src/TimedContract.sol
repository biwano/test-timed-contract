// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TimedContract
/// @notice Stores per-account state and last-changed timestamps. Allows permissionless
///         resets and time-based updates with internal iteration bounded by a constant.
contract TimedContract {
    // --- Types ---
    enum AccountState {
        INITIAL,
        UPDATED
    }

    // --- Constants ---
    uint256 public constant TEN_MINUTES = 10 minutes;
    uint256 public constant MAX_TO_PROCESS = 50; // bounded per update() call

    // --- Errors ---
    error NothingToProcess();

    // --- Storage ---
    address[] private accounts;
    mapping(address => uint256) private accountIndex; // 1-based index; 0 => not present
    mapping(address => AccountState) private stateByAccount;
    mapping(address => uint256) private lastChangedAt;
    uint256 private updateCursor; // 0-based index into accounts

    // --- Events ---
    event AccountRegistered(address indexed account);
    event StateReset(address indexed account);
    event StateUpdated(address indexed account);

    // --- Views ---
    function state(address account) external view returns (AccountState) {
        return stateByAccount[account];
    }

    function lastChanged(address account) external view returns (uint256) {
        return lastChangedAt[account];
    }

    function totalAccounts() external view returns (uint256) {
        return accounts.length;
    }

    // --- Mutations ---
    function reset(address account) external {
        _ensureRegistered(account);
        stateByAccount[account] = AccountState.INITIAL;
        lastChangedAt[account] = block.timestamp;
        emit StateReset(account);
    }

    /// @notice Processes up to MAX_TO_PROCESS accounts in a round-robin fashion.
    ///         If an account's timestamp is older than TEN_MINUTES, its state
    ///         is set to UPDATED and its timestamp refreshed.
    function update() external {
        uint256 numAccounts = accounts.length;
        if (numAccounts == 0) revert NothingToProcess();

        uint256 processed;
        uint256 cursor = updateCursor;
        uint256 threshold = block.timestamp;
        unchecked {
            if (threshold > TEN_MINUTES) {
                threshold -= TEN_MINUTES;
            } else {
                threshold = 0;
            }
        }

        while (processed < MAX_TO_PROCESS) {
            address account = accounts[cursor];
            if (lastChangedAt[account] <= threshold) {
                stateByAccount[account] = AccountState.UPDATED;
                lastChangedAt[account] = block.timestamp;
                emit StateUpdated(account);
            }

            unchecked {
                cursor++;
                processed++;
                if (cursor == numAccounts) cursor = 0;
            }

            if (processed == numAccounts) break; // avoid spinning more than the set size
        }

        updateCursor = cursor;
    }

    // --- Internal helpers ---
    function _ensureRegistered(address account) internal {
        if (accountIndex[account] == 0) {
            accounts.push(account);
            // store index as 1-based
            accountIndex[account] = accounts.length;
            emit AccountRegistered(account);
        }
    }
}


