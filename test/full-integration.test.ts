// Test configuration
const RPC_URL = "http://localhost:8545";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Process management
let anvilProcess: Deno.ChildProcess | null = null;

// Helper function to wait for service to be ready
async function waitForService(url: string, serviceName: string, maxRetries = 30) {
  console.log(`Waiting for ${serviceName} to be ready...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // For RPC endpoints, use POST with a simple JSON-RPC call
      if (url.includes("8545")) {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            params: [],
            id: 1
          })
        });
        if (response.ok) {
          console.log(`✓ ${serviceName} is ready`);
          return;
        }
      } else {
        // For other services, use GET
        const response = await fetch(url, { method: "GET" });
        if (response.ok) {
          console.log(`✓ ${serviceName} is ready`);
          return;
        }
      }
    } catch (error) {
      // Service not ready yet
    }
    
    console.log(`  Attempt ${i + 1}/${maxRetries} - ${serviceName} not ready yet`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error(`${serviceName} failed to start within ${maxRetries * 2} seconds`);
}

// Helper function to start Anvil fork
async function startAnvil() {
  console.log("Starting Anvil fork...");
  
  // Start Anvil in background using Deno.Command
  const command = new Deno.Command("anvil", {
    args: ["--host", "0.0.0.0", "--state", "state.anvil"],
  });
  
  anvilProcess = command.spawn();
  
  // Wait for Anvil to be ready
  await waitForService(RPC_URL, "Anvil RPC");
  
  console.log("✓ Anvil fork started");
}

// Helper function to start Graph Node
async function startGraphNode() {
  console.log("Starting Graph Node...");
  
  // Change to graph-node directory and start docker compose
  const command = new Deno.Command("docker", {
    args: ["compose", "up", "-d"],
    cwd: "modules/graph-node",
  });
  
  const { code } = await command.output();
  
  if (code !== 0) {
    throw new Error("Failed to start Graph Node");
  }
  
  // Wait for Graph Node to be ready
  await waitForService("http://localhost:8000", "Graph Node GraphQL");
  
  console.log("✓ Graph Node started");
}

// Helper function to setup subgraph
async function setupSubgraph() {
  console.log("Setting up subgraph...");
  
  // Install dependencies and prepare
  const prepareCommand = new Deno.Command("npm", {
    args: ["install"],
    cwd: "modules/subgraph",
  });
  
  const { code: prepareCode } = await prepareCommand.output();
  
  if (prepareCode !== 0) {
    throw new Error("Failed to install subgraph dependencies");
  }
  
  // Prepare subgraph
  const prepareSubgraphCommand = new Deno.Command("npm", {
    args: ["run", "prepare"],
    cwd: "modules/subgraph",
  });
  
  const { code: prepareSubgraphCode } = await prepareSubgraphCommand.output();
  
  if (prepareSubgraphCode !== 0) {
    throw new Error("Failed to prepare subgraph");
  }
  
  // Create subgraph using Deno task
  const createCommand = new Deno.Command("deno", {
    args: ["task", "subgraph:create"],
  });

  const { code: createCode, stdout: createStdout, stderr: createStderr } = await createCommand.output();

  if (createCode !== 0) {
    const errorText = new TextDecoder().decode(createStderr);
    const outputText = new TextDecoder().decode(createStdout);
    console.error("Subgraph creation failed:");
    console.error("STDOUT:", outputText);
    console.error("STDERR:", errorText);
    throw new Error(`Failed to create subgraph: ${errorText}`);
  }

  // Generate random version label
  const versionLabel = `v${Date.now()}`;
  
  // Deploy subgraph using Deno task with random version
  const deployCommand = new Deno.Command("deno", {
    args: ["task", "subgraph:deploy", "--", "--version-label", versionLabel]
  });

  const { code: deployCode, stdout: deployStdout, stderr: deployStderr } = await deployCommand.output();

  if (deployCode !== 0) {
    const errorText = new TextDecoder().decode(deployStderr);
    const outputText = new TextDecoder().decode(deployStdout);
    console.error("Subgraph deployment failed:");
    console.error("STDOUT:", outputText);
    console.error("STDERR:", errorText);
    throw new Error(`Failed to deploy subgraph: ${errorText}`);
  }
  
  console.log("✓ Subgraph setup complete");
  
  // Extract deployment ID from deployment output
  const deployOutput = new TextDecoder().decode(deployStdout);
  const deploymentMatch = deployOutput.match(/Deployed to http:\/\/localhost:8000\/subgraphs\/name\/timed-contract\/([a-zA-Z0-9]+)/);
  
  if (deploymentMatch) {
    const deploymentId = deploymentMatch[1];
    const deploymentUrl = `http://localhost:8000/subgraphs/name/timed-contract/${deploymentId}`;
    console.log(`Subgraph deployed at: ${deploymentUrl}`);
    return deploymentUrl;
  } else {
    console.error("Failed to extract deployment ID from subgraph deployment output:");
    console.error("STDOUT:", deployOutput);
    throw new Error("Could not extract deployment ID from subgraph deployment output");
  }
}

// Helper function to stop all processes
async function stopAllProcesses() {
  console.log("Stopping all processes...");
  
  // Stop Graph Node
  try {
    const stopCommand = new Deno.Command("docker", {
      args: ["compose", "down"],
      cwd: "modules/graph-node",
    });
    
    await stopCommand.output();
    console.log("✓ Graph Node stopped");
  } catch (error) {
    console.error("Error stopping Graph Node:", error);
  }
  
  // Stop Anvil
  if (anvilProcess) {
    try {
      anvilProcess.kill("SIGTERM");
      await anvilProcess.status;
      console.log("✓ Anvil stopped");
    } catch (error) {
      console.error("Error stopping Anvil:", error);
    }
  }
}

// Run the integration test as a subprocess
async function runIntegrationTest(deploymentUrl: string) {
  console.log("Running integration test...");
  
  const command = new Deno.Command("deno", {
    args: [
      "test",
      "--allow-net",
      "--allow-run",
      "test/integration.test.ts",
      deploymentUrl
    ],
  });
  
  const { code, stdout, stderr } = await command.output();
  
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    const outputText = new TextDecoder().decode(stdout);
    throw new Error(`Integration test failed:\n${errorText}\n${outputText}`);
  }
  
  const outputText = new TextDecoder().decode(stdout);
  console.log("Integration test output:", outputText);
  console.log("✓ Integration test passed");
}

// Main test that manages the entire lifecycle
Deno.test("Full Integration Test", async () => {
  try {
    // Start infrastructure
    await startAnvil();
    await startGraphNode();

//    await new Promise(resolve => setTimeout(resolve, 100000));
    
    // Setup contract and subgraph
    const deploymentUrl = await setupSubgraph();
    
    // Run the actual integration test with the deployment URL
    await runIntegrationTest(deploymentUrl);
    
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    // Always clean up, even if there's an error
    await stopAllProcesses();
  }
});
