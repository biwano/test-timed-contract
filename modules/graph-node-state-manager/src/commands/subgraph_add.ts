import { Command } from "cliffy/command";
import { ensureDir } from "std/fs/ensure_dir.ts";
import { DEFAULT_PROJECT_NAME, FOUNDRY_ROOT, REGISTRY_PATH } from "../utils/constants.ts";
import { parse as parseYaml } from "std/yaml/mod.ts";

export const initCommand = new Command()
  .name("subgraph:add")
  .description("Initialize a foundry project for event faking")
  .option("-s, --subgraph <path>", "Path of the subgraph folder associated with the foundry project", { required: true })
  .option("-n, --name <name>", "Name of the foundry project", { default: DEFAULT_PROJECT_NAME })
  .action(async (options: { subgraph: string; name: string }) => {
    const projectPath = `${FOUNDRY_ROOT}/${options.name}`;
    const subgraphPath = options.subgraph;
    
    console.log(`Initializing foundry project at: ${projectPath}`);
    
    try {
      // Validate subgraph YAML file
      const subgraphYamlPath = `${subgraphPath}/subgraph.yaml`;
      console.log(`Validating subgraph YAML file: ${subgraphYamlPath}`);
      
      try {
        const subgraphContent = await Deno.readTextFile(subgraphYamlPath);
        const subgraphData = parseYaml(subgraphContent) as Record<string, unknown>;
        
        // Basic validation of subgraph structure
        if (!subgraphData.specVersion) {
          throw new Error("Invalid subgraph.yaml: missing required fields (specVersion, dataSources)");
        }
        console.log("✅ Subgraph YAML validation passed");
        
      } catch (error) {
        throw new Error(`Subgraph validation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
     // Ensure the directory exists
      await ensureDir(projectPath);
      
      // Change to the project directory
      const originalCwd = Deno.cwd();
      Deno.chdir(projectPath);
      
      // Initialize foundry project
      const initProcess = new Deno.Command("forge", {
        args: ["init", ".", "--force"],
        stdout: "piped",
        stderr: "piped",
      });
      
      const { code, stdout, stderr } = await initProcess.output();
      
      if (code !== 0) {
        const errorText = new TextDecoder().decode(stderr);
        throw new Error(`Failed to initialize foundry project: ${errorText}`);
      }
      
      console.log("Foundry project initialized successfully!");
      console.log(new TextDecoder().decode(stdout));
      
      // Create or update sef.json registry in anvil-event-faker folder
      let registry: Record<string, { subgraph_path: string }> = {};
      
      try {
        const existingRegistry = await Deno.readTextFile(REGISTRY_PATH);
        registry = JSON.parse(existingRegistry);
      } catch {
        // File doesn't exist, start with empty registry
      }
      
      // Add or update entry for this project
      registry[options.name] = {
        subgraph_path: subgraphPath
      };
      
      await Deno.writeTextFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
      console.log(`Updated sef.json registry with project: ${projectPath}`);
      
      // Change back to original directory
      Deno.chdir(originalCwd);
      
    } catch (error) {
      console.error("Error initializing foundry project:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });
