import { ensureDir } from "std/fs/ensure_dir.ts";
import { join } from "std/path/mod.ts";
import { parseSubgraph } from "../utils/subgraph_parser.ts";
import { generateFakeContract } from "../utils/contract_generator.ts";
import { buildDeployScript } from "../utils/deploy_script_generator.ts";
import { REGISTRY_PATH } from "../utils/constants.ts";

export async function generateForProjectTask(projectName: string, subgraphPath: string, outRoot: string): Promise<void> {
  const resolvedSubgraphYamlPath = `${subgraphPath}/subgraph.yaml`;
  const outputDir = `${outRoot}/${projectName}/src`;

  console.log("Configuration loaded:");
  console.log(`  Project name: ${projectName}`);
  console.log(`  Subgraph path: ${resolvedSubgraphYamlPath}`);
  console.log(`  Output directory: ${outputDir}`);

  const subgraphData = await parseSubgraph(resolvedSubgraphYamlPath);
  console.log(`Found ${subgraphData.contracts.length} contracts in subgraph`);

  await ensureDir(outputDir);
  const scriptDir = join(`${outRoot}/${projectName}`, "script");
  await ensureDir(scriptDir);

  for (const contract of subgraphData.contracts) {
    console.log(`Generating fake contract for: ${contract.name}`);
    const contractCode = await generateFakeContract(contract);
    const outputPath = join(outputDir, `${contract.name}.sol`);
    await Deno.writeTextFile(outputPath, contractCode);
    console.log(`  Created: ${outputPath}`);
  }

  const deployScriptPath = join(scriptDir, "Deploy.s.sol");
  const deployScript = await buildDeployScript(projectName, subgraphData.contracts);
  await Deno.writeTextFile(deployScriptPath, deployScript);
  console.log(`Created deployment script: ${deployScriptPath}`);

  console.log(`Fake contracts generated successfully for project: ${projectName}!`);
}

export async function generateAllProjectsTask(): Promise<void> {
  const registryContent = await Deno.readTextFile(REGISTRY_PATH);
  const registry = JSON.parse(registryContent) as Record<string, { subgraph_path: string }>;
  
  const projectNames = Object.keys(registry);
  if (projectNames.length === 0) {
    console.log("No projects found in registry. Run 'subgraph:add' first.");
    return;
  }

  for (const projectName of projectNames) {
    const projectConfig = registry[projectName];
    await generateForProjectTask(projectName, projectConfig.subgraph_path, "./foundry");
  }
}


