import { Command } from "cliffy/command";
import { startAnvilTask } from "../tasks/anvil_start.ts";

export const startAnvilCommand = new Command()
  .name("task:start:anvil")
  .description("Start anvil in the background and wait for it to start")
  .action(async () => {
    try {
      await startAnvilTask();
    } catch (error) {
      console.error("Error starting anvil:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });
