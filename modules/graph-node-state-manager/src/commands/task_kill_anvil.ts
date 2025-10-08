import { Command } from "cliffy/command";
import { killAnvilTask } from "../tasks/anvil_kill.ts";

export const killAnvilCommand = new Command()
  .name("task:kill:anvil")
  .description("Stop anvil if it is running")
  .action(async () => {
    try {
      await killAnvilTask();
    } catch (error) {
      console.error("Error killing anvil:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });
