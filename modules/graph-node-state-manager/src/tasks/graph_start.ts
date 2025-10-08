export async function startGraphNodeTask(): Promise<void> {
  console.log("🚀 Starting graph-node with docker-compose...");

  // Start graph-node using docker-compose
  const dockerComposeProcess = new Deno.Command("docker", {
    args: ["compose", "up", "-d", "graph-node"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await dockerComposeProcess.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to start graph-node: ${errorText}`);
  }

  console.log("✅ Graph-node started");
  console.log(new TextDecoder().decode(stdout));

  // Wait for graph-node to be ready by checking its health endpoint
  console.log("⏳ Waiting for graph-node to be ready...");
  const maxRetries = 30;
  const retryDelay = 2000; // 2 seconds

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch("http://localhost:8000/subgraphs/name/graph-node/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "{ _meta { hasIndexingErrors } }"
        })
      });

      if (response.ok) {
        console.log("✅ Graph-node is ready and accepting queries");
        return;
      }
    } catch {
      // Graph-node not ready yet, continue waiting
    }

    console.log(`⏳ Graph-node not ready yet, retrying in ${retryDelay}ms... (attempt ${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  throw new Error("Graph-node failed to start within the expected time");
}
