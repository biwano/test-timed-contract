#!/usr/bin/env deno run --allow-read --allow-write --allow-run --allow-net

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { initCommand } from "./commands/init.ts";
import { generateCommand } from "./commands/generate.ts";
import { removeCommand } from "./commands/remove.ts";

const main = new Command()
  .name("anvil-event-faker")
  .description("A tool to create fake contracts that only emit events based on subgraph definitions")
  .version("1.0.0")
  .command("init", initCommand)
  .command("generate", generateCommand)
  .command("remove", removeCommand);

if (import.meta.main) {
  await main.parse(Deno.args);
}
