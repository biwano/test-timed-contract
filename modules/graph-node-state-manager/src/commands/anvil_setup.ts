import { Command } from "cliffy/command";
import { killAnvilTask } from "../tasks/anvil_kill.ts";
import { startAnvilTask } from "../tasks/anvil_start.ts";
import { deployAllProjectsTask } from "../tasks/contracts_deploy.ts";
import { ANVIL_DEFAULT_PRIVATE_KEY, ANVIL_DEFAULT_RPC_URL } from "../utils/constants.ts";

export const anvilSetupCommand = new Command()
  .name("anvil:setup")
  .description("Setup anvil and deploy contracts: kill existing anvil, start new anvil, deploy contracts")
  .action(async () => {
    try {
      console.log("🔧 Setting up anvil environment...");
      
      // Step 1: Kill existing anvil
      console.log("1️⃣  Stopping existing anvil processes...");
      await killAnvilTask();
      
      // Step 2: Start anvil
      console.log("2️⃣  Starting anvil...");
      await startAnvilTask();
      
      // Step 3: Deploy contracts
      console.log("3️⃣  Deploying contracts...");
      await deployAllProjectsTask(ANVIL_DEFAULT_RPC_URL, ANVIL_DEFAULT_PRIVATE_KEY);
      
      console.log("✅ Anvil setup complete!");
    } catch (error) {
      console.error("Error during anvil setup:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });
