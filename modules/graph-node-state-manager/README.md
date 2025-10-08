# Anvil Event Faker

A CLI tool to create fake contracts that only emit events based on subgraph definitions.

## Installation

```bash
deno task install
```

## Usage

### Register a subgraph and initialize a foundry project

```bash
anvil-event-faker subgraph:add [--path <path>]
```

This command:
- Creates a new foundry project using `forge init`
- Creates a `sef.conf` configuration file

### Generate fake contracts

```bash
anvil-event-faker contracts:generate
```

This command:
- Reads the subgraph.yaml file specified in the config
- Parses contract ABIs and extracts events
- Generates fake Solidity contracts that emit those events

## Configuration

The tool reads configuration from `sef.conf`:

```ini
# Solidity Event Faker Configuration
subgraph_path = "../subgraph/subgraph.yaml"
output_dir = "./src/fake_contracts"
```

## Example

1. Register a subgraph and initialize a project:
   ```bash
   anvil-event-faker subgraph:add --path ./my-event-faker
   ```

2. Update the `sef.conf` file to point to your subgraph

3. Generate fake contracts for all registered projects:
   ```bash
   anvil-event-faker contracts:generate
   ```

This will create Solidity contracts in the output directory, each with functions that emit the events defined in your subgraph.
