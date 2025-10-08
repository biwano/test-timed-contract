import { Command } from "cliffy/command";
import { exists } from "std/fs/exists.ts";
import { REGISTRY_PATH } from "../utils/constants.ts";

export const removeCommand = new Command()
  .name("subgraph:remove")
  .description("Remove a foundry project from registry and filesystem")
  .option("-n, --name <name>", "Name of the project to remove", { required: true })
  .option("-f, --force", "Force removal without confirmation", { default: false })
  .action(async (options: { name: string; force: boolean }) => {
    try {
      const projectName = options.name;
      const projectPath = `./${projectName}`;
      const registryPath = REGISTRY_PATH;
      
      // Check if project exists in registry
      let registry: Record<string, { subgraph_path: string }> = {};
      try {
        const registryContent = await Deno.readTextFile(registryPath);
        registry = JSON.parse(registryContent);
      } catch {
        console.error("Registry file not found. No projects to remove.");
        Deno.exit(1);
      }
      
      if (!registry[projectName]) {
        console.error(`Project '${projectName}' not found in registry.`);
        Deno.exit(1);
      }
      
      // Check if project directory exists
      if (!(await exists(projectPath))) {
        console.log(`Project directory '${projectPath}' not found. Removing from registry only.`);
      } else {
        // Confirm removal unless force flag is used
        if (!options.force) {
          console.log(`This will permanently delete the project '${projectName}' and all its files.`);
          console.log(`Project directory: ${projectPath}`);
          console.log(`Subgraph path: ${registry[projectName].subgraph_path}`);
          
          const response = prompt("Are you sure you want to continue? (y/N): ");
          if (response?.toLowerCase() !== 'y' && response?.toLowerCase() !== 'yes') {
            console.log("Operation cancelled.");
            Deno.exit(0);
          }
        }
        
        // Remove project directory
        try {
          await Deno.remove(projectPath, { recursive: true });
          console.log(`✅ Removed project directory: ${projectPath}`);
        } catch (error) {
          console.error(`Failed to remove project directory: ${error instanceof Error ? error.message : String(error)}`);
          Deno.exit(1);
        }
      }
      
      // Remove from registry
      delete registry[projectName];
      
      // Update registry file
      if (Object.keys(registry).length === 0) {
        // If registry is empty, remove the file
        try {
          await Deno.remove(registryPath);
          console.log("✅ Removed empty registry file");
        } catch {
          // File might not exist, that's okay
        }
      } else {
        // Update registry with remaining projects
        await Deno.writeTextFile(registryPath, JSON.stringify(registry, null, 2));
        console.log("✅ Updated registry file");
      }
      
      console.log(`✅ Successfully removed project '${projectName}'`);
      
    } catch (error) {
      console.error("Error removing project:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });
