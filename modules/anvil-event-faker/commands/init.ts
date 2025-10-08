import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/ensure_dir.ts";

export const initCommand = new Command()
  .name("init")
  .description("Initialize a foundry project for event faking")
  .option("-s, --subgraph <path>", "Path of the subgraph folder associated with the foundry project", { required: true })
  .option("-n, --name <name>", "Name of the folder containing the foundry project", { default: "foundry" })
  .action(async (options: { subgraph: string; name: string }) => {
    const projectPath = options.name;
    const subgraphPath = options.subgraph;
    
    console.log(`Initializing foundry project at: ${projectPath}`);
    
    try {
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
      
      // Create a basic sef.json file
      const configContent = {
        name: projectPath,
        subgraph_path: `${subgraphPath}/subgraph.yaml`,
        output_dir: "./src/fake_contracts"
      };
      
      await Deno.writeTextFile("sef.json", JSON.stringify(configContent, null, 2));
      console.log("Created sef.json configuration file");
      
      // Change back to original directory
      Deno.chdir(originalCwd);
      
    } catch (error) {
      console.error("Error initializing foundry project:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });
