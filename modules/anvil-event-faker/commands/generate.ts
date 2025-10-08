import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { parseSubgraph } from "../utils/subgraph_parser.ts";
import { generateFakeContract } from "../utils/contract_generator.ts";

export const generateCommand = new Command()
  .name("generate")
  .description("Generate fake contracts based on subgraph definitions")
  .option("-c, --config <path>", "Path to sef.json configuration file", { default: "./sef.json" })
  .option("-n, --name <name>", "Name of the folder containing the foundry project", { default: "foundry" })
  .action(async (options: { config: string; name: string }) => {
    try {
      // Read configuration file
      const configPath = options.config;
      const configContent = await Deno.readTextFile(configPath);
      const config = JSON.parse(configContent) as Config;
      
      console.log("Configuration loaded:");
      console.log(`  Project name: ${config.name}`);
      console.log(`  Subgraph path: ${config.subgraph_path}`);
      console.log(`  Output directory: ${config.output_dir}`);
      
      // Parse subgraph.yaml
      const subgraphData = await parseSubgraph(config.subgraph_path);
      console.log(`Found ${subgraphData.contracts.length} contracts in subgraph`);
      
      // Ensure output directory exists
      await ensureDir(config.output_dir);
      
      // Generate fake contracts for each contract
      for (const contract of subgraphData.contracts) {
        console.log(`Generating fake contract for: ${contract.name}`);
        const contractCode = generateFakeContract(contract);
        
        const outputPath = join(config.output_dir, `${contract.name}.sol`);
        await Deno.writeTextFile(outputPath, contractCode);
        console.log(`  Created: ${outputPath}`);
      }
      
      console.log("Fake contracts generated successfully!");
      
    } catch (error) {
      console.error("Error generating fake contracts:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

interface Config {
  name: string;
  subgraph_path: string;
  output_dir: string;
}

