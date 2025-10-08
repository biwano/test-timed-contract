import { Command } from "cliffy/command";
import { FOUNDRY_ROOT } from "../utils/constants.ts";
import { subgraphRemoveTask } from "../tasks/subgraph_remove.ts";

export const removeCommand = new Command()
  .name("subgraph:remove")
  .description("Remove a foundry project from registry and filesystem")
  .option("-n, --name <name>", "Name of the project to remove", { required: true })
  .option("-f, --force", "Force removal without confirmation", { default: false })
  .action(async (options: { name: string; force: boolean }) => {
    try {
      const projectName = options.name;
      const projectPath = `${FOUNDRY_ROOT}/${projectName}`;
      
      await subgraphRemoveTask(projectPath, projectName, options.force);
    } catch (error) {
      console.error("Error removing project:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });
