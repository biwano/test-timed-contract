import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { parseSubgraph } from "../utils/subgraph_parser.ts";
import { generateFakeContract } from "../utils/contract_generator.ts";
import { buildDeployScript } from "../utils/deploy_script.ts";

export const generateCommand = new Command()
  .name("generate")
  .description("Generate fake contracts based on subgraph definitions")
  .option("-n, --name <name>", "Name of the folder containing the foundry project", { default: "foundry" })
  .action(async (options: { name: string }) => {
    try {
      // Read from sef.json registry
      const registryPath = "./sef.json";
      const registryContent = await Deno.readTextFile(registryPath);
      const registry = JSON.parse(registryContent) as Record<string, { subgraph_path: string }>;
      
      // Get project configuration from registry
      const projectConfig = registry[options.name];
      if (!projectConfig) {
        throw new Error(`Project '${options.name}' not found in registry. Run 'init' command first.`);
      }
      
      const subgraphPath = `${projectConfig.subgraph_path}/subgraph.yaml`;
      const outputDir = `./${options.name}/src`;
      
      console.log("Configuration loaded:");
      console.log(`  Project name: ${options.name}`);
      console.log(`  Subgraph path: ${subgraphPath}`);
      console.log(`  Output directory: ${outputDir}`);
      
      // Parse subgraph.yaml
      const subgraphData = await parseSubgraph(subgraphPath);
      console.log(`Found ${subgraphData.contracts.length} contracts in subgraph`);
      
      // Ensure output directories exist
      await ensureDir(outputDir);
      const scriptDir = join(`./${options.name}`, "script");
      await ensureDir(scriptDir);
      
      // Generate fake contracts for each contract
      for (const contract of subgraphData.contracts) {
        console.log(`Generating fake contract for: ${contract.name}`);
        const contractCode = generateFakeContract(contract);
        
        const outputPath = join(outputDir, `${contract.name}.sol`);
        await Deno.writeTextFile(outputPath, contractCode);
        console.log(`  Created: ${outputPath}`);
      }
      
      // Generate Foundry deployment script that deploys and etches to target addresses
      const deployScriptPath = join(scriptDir, "Deploy.s.sol");
      const deployScript = buildDeployScript(options.name, subgraphData.contracts);
      await Deno.writeTextFile(deployScriptPath, deployScript);
      console.log(`Created deployment script: ${deployScriptPath}`);
      
      console.log("Fake contracts generated successfully!");
      
    } catch (error) {
      console.error("Error generating fake contracts:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


