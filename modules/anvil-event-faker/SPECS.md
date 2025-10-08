# Solidity Event Faker
A tool to create fake contracts that only emits events based on subgraph definitions

## Frameworks used

- deno
- cliffy (for CLI argument parsing)
- anvil
- foundry

## What is it
It is a CLI that can perform multiple tasks. It reads its config from a file called sef.json

## Implementation Status: ✅ COMPLETED

The tasks are:
- **init**: Use foundry CLI to instantiate a foundry project
  - Creates a new foundry project using `forge init`
  - Requires a `--subgraph` argument: path of the subgraph folder associated with the the foundry project
  - Takes a `--name` argument: name of the folder containing the foundry project (defaults to foundry)
  - Generates a `sef.json` configuration file containing the values of the name and subgraph arguments
- **generate**: 
  - Parses subgraph.yaml file (derived from sef.json)
  - Takes a `--name` argument: name of the folder containing the foundry project (defaults to foundry)
  - Extracts contract ABIs and events from subgraph definitions
  - For each contract name creates an actual Solidity contract where there is one function per associated event
  - Each function has the same arguments as the events and its purpose is only to emit the associated event
  - Supports custom config file path via `--config` option

## Usage

```bash
# Install the CLI
deno install --allow-read --allow-write --allow-run --allow-net -n anvil-event-faker main.ts

# Initialize a project
anvil-event-faker init --subgraph ../subgraph --name my-project

# Generate fake contracts
anvil-event-faker generate --config ./sef.json --name my-project
```

## Configuration

The tool reads configuration from `sef.json`:
```json
{
  "name": "my-project",
  "subgraph_path": "../subgraph/subgraph.yaml",
  "output_dir": "./src/fake_contracts"
}
```

## Quality

No compile warnings - All code passes Deno linting without warnings
