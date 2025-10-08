import { Command } from "cliffy/command";
import { ensureDir } from "std/fs/ensure_dir.ts";
import { join } from "std/path/mod.ts";
import { parseSubgraph } from "../utils/subgraph_parser.ts";
import { generateFakeContract } from "../utils/contract_generator.ts";
import { buildDeployScript } from "../utils/deploy_script_generator.ts";

// Generate code for a single registered project
export async function generateForProject(projectName: string, subgraphPath: string): Promise<void> {
  const resolvedSubgraphYamlPath = `${subgraphPath}/subgraph.yaml`;
  const outputDir = `./${projectName}/src`;

  console.log("Configuration loaded:");
  console.log(`  Project name: ${projectName}`);
  console.log(`  Subgraph path: ${resolvedSubgraphYamlPath}`);
  console.log(`  Output directory: ${outputDir}`);

  // Parse subgraph.yaml
  const subgraphData = await parseSubgraph(resolvedSubgraphYamlPath);
  console.log(`Found ${subgraphData.contracts.length} contracts in subgraph`);

  // Ensure output directories exist
  await ensureDir(outputDir);
  const scriptDir = join(`./${projectName}`, "script");
  await ensureDir(scriptDir);

  // Generate fake contracts for each contract
  for (const contract of subgraphData.contracts) {
    console.log(`Generating fake contract for: ${contract.name}`);
    const contractCode = await generateFakeContract(contract);

    const outputPath = join(outputDir, `${contract.name}.sol`);
    await Deno.writeTextFile(outputPath, contractCode);
    console.log(`  Created: ${outputPath}`);
  }

  // Generate Foundry deployment script that deploys and etches to target addresses
  const deployScriptPath = join(scriptDir, "Deploy.s.sol");
  const deployScript = await buildDeployScript(projectName, subgraphData.contracts);
  await Deno.writeTextFile(deployScriptPath, deployScript);
  console.log(`Created deployment script: ${deployScriptPath}`);

  console.log(`Fake contracts generated successfully for project: ${projectName}!`);
}

export const generateCommand = new Command()
  .name("code:generate")
  .description("Generate fake contracts for all registered projects based on subgraph definitions")
  .action(async () => {
    try {
      // Read from sef.json registry
      const registryPath = "./sef.json";
      const registryContent = await Deno.readTextFile(registryPath);
      const registry = JSON.parse(registryContent) as Record<string, { subgraph_path: string }>;
      
      const projectNames = Object.keys(registry);
      if (projectNames.length === 0) {
        console.log("No projects found in registry. Run 'subgraph:add' first.");
        return;
      }

      for (const projectName of projectNames) {
        const projectConfig = registry[projectName];
        await generateForProject(projectName, projectConfig.subgraph_path);
      }
      
    } catch (error) {
      console.error("Error generating fake contracts:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


