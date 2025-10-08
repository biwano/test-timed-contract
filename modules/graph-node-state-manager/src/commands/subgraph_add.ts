import { Command } from "cliffy/command";
import { DEFAULT_PROJECT_NAME, FOUNDRY_ROOT } from "../utils/constants.ts";
import { subgraphAddTask } from "../tasks/subgraph_add.ts";

export const initCommand = new Command()
  .name("subgraph:add")
  .description("Initialize a foundry project for event faking")
  .option("-s, --subgraph <path>", "Path of the subgraph folder associated with the foundry project", { required: true })
  .option("-n, --name <name>", "Name of the foundry project", { default: DEFAULT_PROJECT_NAME })
  .action(async (options: { subgraph: string; name: string }) => {
    const projectPath = `${FOUNDRY_ROOT}/${options.name}`;
    const subgraphPath = options.subgraph;
    
    try {
      await subgraphAddTask(subgraphPath, projectPath, options.name);
    } catch (error) {
      console.error("Error initializing foundry project:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });
