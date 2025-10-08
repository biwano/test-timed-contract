import { Command } from "cliffy/command";
import { startGraphNodeTask } from "../tasks/graph_start.ts";
import { stopGraphNodeTask } from "../tasks/graph_stop.ts";

export const graphCommand = new Command()
  .name("graph")
  .description("Manage graph-node operations")
  .command("start", new Command()
    .description("Start graph-node")
    .action(async () => {
      try {
        await startGraphNodeTask();
      } catch (error) {
        console.error("Error starting graph-node:", error instanceof Error ? error.message : String(error));
        Deno.exit(1);
      }
    }))
  .command("stop", new Command()
    .description("Stop graph-node")
    .action(async () => {
      try {
        await stopGraphNodeTask();
      } catch (error) {
        console.error("Error stopping graph-node:", error instanceof Error ? error.message : String(error));
        Deno.exit(1);
      }
    }));
