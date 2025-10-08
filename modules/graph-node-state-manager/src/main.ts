#!/usr/bin/env deno run --allow-read --allow-write --allow-run --allow-net

import { Command } from "cliffy/command";
import { initCommand } from "./commands/init.ts";
import { generateCommand } from "./commands/generate.ts";
import { removeCommand } from "./commands/remove.ts";
import { deployCommand } from "./commands/deploy.ts";

const main = new Command()
  .name("graph-node-state-manager")
  .description("Manage fake contracts and deploy them to match a subgraph's state")
  .version("1.0.0")
  .command("subgraph:add", initCommand)
  .command("code:generate", generateCommand)
  .command("subgraph:remove", removeCommand)
  .command("deploy", deployCommand);

if (import.meta.main) {
  await main.parse(Deno.args);
}
