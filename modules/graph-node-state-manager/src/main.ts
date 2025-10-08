#!/usr/bin/env deno run --allow-read --allow-write --allow-run --allow-net

import { Command } from "cliffy/command";
import { taskCommand } from "./commands/task.ts";
import { subgraphCommand } from "./commands/subgraph.ts";
import { graphCommand } from "./commands/graph.ts";

const main = new Command()
  .name("graph-node-state-manager")
  .description("Manage fake contracts and deploy them to match a subgraph's state")
  .version("1.0.0")
  .command("subgraph", subgraphCommand)
  .command("task", taskCommand)
  .command("graph", graphCommand)

if (import.meta.main) {
  await main.parse(Deno.args);
}
