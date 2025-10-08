import { exists } from "std/fs/exists.ts";
import { GRAPH_NODE_URL, IPFS_URL } from "../utils/constants.ts";
import { validateRegistry } from "../utils/registry.ts";

async function deploySubgraph(subgraphPath: string, subgraphName: string): Promise<void> {
  const subgraphYamlPath = `${subgraphPath}/subgraph.yaml`;
  
  if (!(await exists(subgraphYamlPath))) {
    throw new Error(`subgraph.yaml not found at ${subgraphYamlPath}`);
  }

  console.log(`🚀 Creating and deploying subgraph: ${subgraphName}`);
  
  // Change to subgraph directory for deployment
  const originalCwd = Deno.cwd();
  Deno.chdir(subgraphPath);
  
  try {
    // First, create the subgraph
    console.log(`📝 Creating subgraph: ${subgraphName}`);
    const createProcess = new Deno.Command("graph", {
      args: [
        "create",
        "--node", `${GRAPH_NODE_URL}/`,
        subgraphName
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code: createCode, stdout: createStdout, stderr: createStderr } = await createProcess.output();
    
    if (createCode !== 0) {
      const errorText = new TextDecoder().decode(createStderr);
      // If subgraph already exists, that's okay, continue with deployment
      if (!errorText.toLowerCase().includes("already exists")) {
        throw new Error(`Failed to create subgraph ${subgraphName}: ${errorText}`);
      }
      console.log(`ℹ️  Subgraph ${subgraphName} already exists, continuing with deployment`);
    } else {
      console.log(`✅ Subgraph ${subgraphName} created successfully`);
      console.log(new TextDecoder().decode(createStdout));
    }

    // Then, deploy the subgraph
    console.log(`🚀 Deploying subgraph: ${subgraphName}`);
    const deployProcess = new Deno.Command("graph", {
      args: [
        "deploy",
        "--node", `${GRAPH_NODE_URL}/`,
        "--ipfs", IPFS_URL,
        subgraphName,
        subgraphYamlPath
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code: deployCode, stdout: deployStdout, stderr: deployStderr } = await deployProcess.output();
    
    if (deployCode !== 0) {
      const errorText = new TextDecoder().decode(deployStderr);
      throw new Error(`Failed to deploy subgraph ${subgraphName}: ${errorText}`);
    }

    console.log(`✅ Subgraph ${subgraphName} deployed successfully`);
    console.log(new TextDecoder().decode(deployStdout));
  } finally {
    Deno.chdir(originalCwd);
  }
}

export async function deployAllSubgraphsTask(): Promise<void> {
  console.log("🚀 Deploying all subgraphs to local graph-node...");
  
  const registry = await validateRegistry();
  const projectNames = Object.keys(registry);

  for (const projectName of projectNames) {
    const projectConfig = registry[projectName];
    const subgraphPath = projectConfig.subgraph_path;
    
    // Use project name as subgraph name for deployment
    await deploySubgraph(subgraphPath, projectName);
  }

  console.log("✅ All subgraphs deployed successfully");
}
