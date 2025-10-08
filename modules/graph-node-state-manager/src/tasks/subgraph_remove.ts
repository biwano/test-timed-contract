import { exists } from "std/fs/exists.ts";
import { REGISTRY_PATH } from "../utils/constants.ts";

export async function subgraphRemoveTask(projectDir: string, projectName: string, force: boolean): Promise<void> {
  if (!(await exists(projectDir))) {
    console.log(`Project directory '${projectDir}' not found. Removing from registry only.`);
    return;
  }

  if (!force) {
    console.log(`This will permanently delete the project at '${projectDir}' and all its files.`);
    const response = prompt("Are you sure you want to continue? (y/N): ");
    if (response?.toLowerCase() !== 'y' && response?.toLowerCase() !== 'yes') {
      console.log("Operation cancelled.");
      Deno.exit(0);
    }
  }

  try {
    await Deno.remove(projectDir, { recursive: true });
    console.log(`✅ Removed project directory: ${projectDir}`);
  } catch (error) {
    throw new Error(`Failed to remove project directory: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Update registry
  let registry: Record<string, { subgraph_path: string }> = {};
  try {
    const registryContent = await Deno.readTextFile(REGISTRY_PATH);
    registry = JSON.parse(registryContent);
  } catch {
    console.error("Registry file not found. No projects to remove.");
    return;
  }

  if (!registry[projectName]) {
    console.error(`Project '${projectName}' not found in registry.`);
    return;
  }

  delete registry[projectName];

  if (Object.keys(registry).length === 0) {
    try {
      await Deno.remove(REGISTRY_PATH);
      console.log("✅ Removed empty registry file");
    } catch {
      // File might not exist, that's okay
    }
  } else {
    await Deno.writeTextFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
    console.log("✅ Updated registry file");
  }

  console.log(`✅ Successfully removed project '${projectName}'`);
}


