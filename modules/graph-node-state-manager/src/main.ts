#!/usr/bin/env deno run --allow-read --allow-write --allow-run --allow-net

import { Command } from "cliffy/command";
import { initCommand } from "./commands/subgraph_add.ts";
import { generateCommand } from "./commands/contracts_generate.ts";
import { removeCommand } from "./commands/subgraph_remove.ts";
import { deployCommand } from "./commands/contracts_deploy.ts";

const main = new Command()
  .name("graph-node-state-manager")
  .description("Manage fake contracts and deploy them to match a subgraph's state")
  .version("1.0.0")
  .command("subgraph:add", initCommand)
  .command("subgraph:remove", removeCommand)
  .command("contracts:generate", generateCommand)
  .command("contracts:deploy", deployCommand);

if (import.meta.main) {
  await main.parse(Deno.args);
}
