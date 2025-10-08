import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Test configuration
const CONTRACT_ADDRESS = "0xbFFab14C5f812d3200A333594fE86f8410848852";
const RPC_URL = "http://localhost:8545";
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Get GraphQL URL from command line argument or use default
const GRAPHQL_URL = Deno.args[0] || "http://localhost:8000/subgraphs/name/timed-contract";

// Helper function to generate random account address
function generateRandomAccount(): string {
  // Generate 20 random bytes (40 hex characters)
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  
  // Convert to hex string and add 0x prefix
  const hexString = Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  
  return `0x${hexString}`;
}

// Helper function to query subgraph
async function querySubgraph(query: string) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  
  if (!response.ok) {
    throw new Error(`GraphQL query failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  
  return data.data;
}

// Helper function to call contract method using cast
async function callContract(method: string, params: string[] = []) {
  const command = new Deno.Command("cast", {
    args: [
      "send",
      CONTRACT_ADDRESS,
      method,
      ...params,
      "--rpc-url", RPC_URL,
      "--private-key", PRIVATE_KEY
    ],
  });
  
  const { code, stdout, stderr } = await command.output();
  
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Contract call failed: ${errorText}`);
  }
  
  const result = new TextDecoder().decode(stdout);
  console.log(`Contract call result: ${result.trim()}`);
  return result.trim();
}

// Helper function to timewarp using cast
async function timewarp() {
  const command = new Deno.Command("cast", {
    args: [
      "rpc",
      "--rpc-url", RPC_URL,
      "evm_increaseTime",
      "600"
    ],
  });
  
  const { code, stdout, stderr } = await command.output();
  
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Timewarp failed: ${errorText}`);
  }
  
  // Mine a block to apply the time change
  const mineCommand = new Deno.Command("cast", {
    args: [
      "rpc",
      "--rpc-url", RPC_URL,
      "evm_mine"
    ],
  });
  
  const { code: mineCode, stderr: mineStderr } = await mineCommand.output();
  
  if (mineCode !== 0) {
    const errorText = new TextDecoder().decode(mineStderr);
    throw new Error(`Mining failed: ${errorText}`);
  }
  
  console.log("Timewarp completed: +10 minutes");
}

Deno.test("TimedContract Integration Test", async () => {
  // Generate a random account
  const testAccount = generateRandomAccount();
  console.log(`Testing with randomly generated account: ${testAccount}`);
  
  // 1. Query subgraph to check account is not indexed
  console.log("1. Checking account is not indexed...");
  const initialQuery = `
    query {
      account(id: "${testAccount.toLowerCase()}") {
        id
        state
        registeredAt
        lastUpdatedAt
        totalResets
        totalUpdates
      }
    }
  `;
  
  const initialData = await querySubgraph(initialQuery);
  assertEquals(initialData.account, null, "Account should not be indexed initially");
  console.log("✓ Account is not indexed initially");
  
  // 2. Call reset on the account
  console.log("2. Calling reset on account...");
  await callContract("reset(address)", [testAccount]);
  console.log("✓ Reset called successfully");
  
  // Wait a moment for subgraph to process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 3. Query subgraph to check account is indexed with correct state
  console.log("3. Checking account is indexed after reset...");
  const afterResetQuery = `
    query {
      account(id: "${testAccount.toLowerCase()}") {
        id
        state
        registeredAt
        lastUpdatedAt
        totalResets
        totalUpdates
      }
    }
  `;
  
  const afterResetData = await querySubgraph(afterResetQuery);
  assertExists(afterResetData.account, "Account should be indexed after reset");
  assertEquals(afterResetData.account.state, "INITIAL", "Account state should be INITIAL");
  assertEquals(afterResetData.account.totalResets, "1", "Total resets should be 1");
  assertEquals(afterResetData.account.totalUpdates, "0", "Total updates should be 0");
  console.log("✓ Account is indexed with correct state after reset");
  
  // 4. Call update
  console.log("4. Calling update...");
  await callContract("update()", []);
  console.log("✓ Update called successfully");
  
  // Wait a moment for subgraph to process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 5. Query subgraph to check account state was not updated (too soon)
  console.log("5. Checking account state was not updated (too soon)...");
  const afterUpdateQuery = `
    query {
      account(id: "${testAccount.toLowerCase()}") {
        id
        state
        lastUpdatedAt
        totalResets
        totalUpdates
      }
    }
  `;
  
  const afterUpdateData = await querySubgraph(afterUpdateQuery);
  assertEquals(afterUpdateData.account.state, "INITIAL", "Account state should still be INITIAL (too soon)");
  assertEquals(afterUpdateData.account.totalUpdates, "0", "Total updates should still be 0");
  console.log("✓ Account state was not updated (too soon)");
  
  // 6. Timewarp by 10 minutes
  console.log("6. Timewarping by 10 minutes...");
  await timewarp();
  console.log("✓ Timewarp completed");
  
  // 7. Call update again
  console.log("7. Calling update after timewarp...");
  await callContract("update()", []);
  console.log("✓ Update called successfully after timewarp");
  
  // Wait a moment for subgraph to process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 8. Query subgraph to check account state was updated
  console.log("8. Checking account state was updated after timewarp...");
  const afterTimewarpQuery = `
    query {
      account(id: "${testAccount.toLowerCase()}") {
        id
        state
        lastUpdatedAt
        totalResets
        totalUpdates
      }
    }
  `;
  
  const afterTimewarpData = await querySubgraph(afterTimewarpQuery);
  assertEquals(afterTimewarpData.account.state, "UPDATED", "Account state should be UPDATED after timewarp");
  assertEquals(afterTimewarpData.account.totalUpdates, "1", "Total updates should be 1");
  console.log("✓ Account state was updated after timewarp");
  
  console.log("🎉 All tests passed!");
});
