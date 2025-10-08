# Anvil Event Faker

A CLI tool to create fake contracts that only emit events based on subgraph definitions.

## Installation

```bash
deno install --allow-read --allow-write --allow-run --allow-net -n anvil-event-faker main.ts
```

## Usage

### Initialize a foundry project

```bash
anvil-event-faker init [--path <path>]
```

This command:
- Creates a new foundry project using `forge init`
- Creates a `sef.conf` configuration file

### Generate fake contracts

```bash
anvil-event-faker generate [--config <path>]
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

1. Initialize a project:
   ```bash
   anvil-event-faker init --path ./my-event-faker
   ```

2. Update the `sef.conf` file to point to your subgraph

3. Generate fake contracts:
   ```bash
   anvil-event-faker generate
   ```

This will create Solidity contracts in the output directory, each with functions that emit the events defined in your subgraph.
