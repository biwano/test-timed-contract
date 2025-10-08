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

  // Wait a moment for services to start
  console.log("⏳ Waiting for graph-node to be ready...");
  await new Promise(resolve => setTimeout(resolve, 5000));
}
