import { ensureDir } from "std/fs/ensure_dir.ts";
import { parse as parseYaml } from "std/yaml/mod.ts";
import { upsertProject } from "../utils/config.ts";

export async function subgraphAddTask(subgraphPath: string, projectDir: string, projectName: string): Promise<void> {
  console.log(`Initializing foundry project at: ${projectDir}`);

  // Validate subgraph YAML file
  const subgraphYamlPath = `${subgraphPath}/subgraph.yaml`;
  console.log(`Validating subgraph YAML file: ${subgraphYamlPath}`);

  const subgraphContent = await Deno.readTextFile(subgraphYamlPath);
  const subgraphData = parseYaml(subgraphContent) as Record<string, unknown>;
  if (!subgraphData.specVersion) {
    throw new Error("Invalid subgraph.yaml: missing required fields (specVersion, dataSources)");
  }
  console.log("✅ Subgraph YAML validation passed");

  await ensureDir(projectDir);

  const originalCwd = Deno.cwd();
  Deno.chdir(projectDir);
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
  Deno.chdir(originalCwd);

  await upsertProject(projectName, { subgraph_path: subgraphPath });
  console.log(`Updated registry with project: ${projectName}`);
}


