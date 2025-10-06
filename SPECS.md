# Specs

## Part 1: Project

The project should be developed using:

- The deno runtime and package manager
- foundry
- openzeppelin

## Part 1: Solidity contract

### Specs

#### TimedContract Contract

A contract that stores user state

The information stored is a:

- A map of accounts associated to a state
- A map of accounts associated to the date when the state last changed

The contract must implement those permissionless methods:
- reset(account address) : Sets the account state to INITIAL and updates its timestamp
- update(): Iterates internal account list round-robin and, for up to MAX_TO_PROCESS accounts whose timestamp is older than 10 minutes, sets the state to UPDATED and updates their timestamp. MAX_TO_PROCESS is a contract constant.
- state(account address) : Returns the state of the given account

#### Deployment contract (Deploy.s.sol)

- A foundry script to deploy the TimedContract Contract on any EVM compatible blockchain (with a deno.json task) implementing a single run method

### Gotchas

- Dates should be stored as timestamps

### Tests

- Tests for all the TimedContract Contract methods

## Part 2: Scripts

### Specs

#### Contract helpers

- A script to reset an account state (TypeScript)
- A script to update account states using the contract's internal iteration (TypeScript)
- A script to get the state of an account (TypeScript)

### Gotchas

- The scripts should take their input from command line arguments
- Scripts will prompt for keystore password when needed
- Use cliffy for argument parsing

### Tests

- Tests for contract helpers scripts
- The tests should be bash scripts that:
  - Start a fresh local fork of the base blockchain using forge
  - Deploy the TimedContract contract using an anvil wallet
  - Call the script
  - Call the contract methods to verify that the state was updated accordingly
  - Stop the local fork
- Create a bash test helper script to store shared functionnalities

### Part 4: Quality

- Build or test commands should not emit warnings
- deno run commands should never include --allow-all, use specific --allow
  arguments
- Use Custom errors for reverts
- Optimize contracts for gas efficiency
