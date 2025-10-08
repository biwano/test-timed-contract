import { Command } from "cliffy/command";
import { killAnvilTask } from "../tasks/anvil_kill.ts";
import { ANVIL_DEFAULT_PRIVATE_KEY, ANVIL_DEFAULT_RPC_URL } from "../utils/constants.ts";
import { deployAllProjectsTask } from "../tasks/contracts_deploy.ts";
import { startAnvilTask } from "../tasks/anvil_start.ts";

export const killAnvilCommand = new Command()
  .name("anvil:stoss")
  .description("Stop anvil if it is running")
  .action(async () => {
    try {
      await killAnvilTask();
    } catch (error) {
      console.error("Error killing anvil:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const startAnvilCommand = new Command()
  .name("anvil:start")
  .description("Start anvil in the background and wait for it to start")
  .action(async () => {
    try {
      await startAnvilTask();
      Deno.exit(0);
    } catch (error) {
      console.error("Error starting anvil:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


export const anvilSetupCommand = new Command()
  .name("anvil:setup")
  .description("Setup anvil and deploy contracts: kill existing anvil, start new anvil, deploy contracts")
  .action(async () => {
    try {
      await killAnvilTask();
      await startAnvilTask();
      await deployAllProjectsTask(ANVIL_DEFAULT_RPC_URL, ANVIL_DEFAULT_PRIVATE_KEY);
      Deno.exit(0);
    } catch (error) {
      console.error("Error during anvil setup:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


  import { generateAllProjectsTask } from "../tasks/contracts_generate.ts";

export const generateCommand = new Command()
  .name("contracts:generate")
  .description("Generate fake contracts for all registered projects based on subgraph definitions")
  .action(async () => {
    try {
      await generateAllProjectsTask();
    } catch (error) {
      console.error("Error generating fake contracts:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


export const deployCommand = new Command()
  .name("contracts:deploy")
  .description("Deploy generated fake contracts on the local Anvil fork using Foundry script")
  .action(async () => {
    try {
      await deployAllProjectsTask(ANVIL_DEFAULT_RPC_URL, ANVIL_DEFAULT_PRIVATE_KEY);
    } catch (error) {
      console.error("Error deploying fakes:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


  
export const taskCommand = new Command()
.name("task")
.description("Task commands")
.command("anvil:start", startAnvilCommand)
.command("anvil:stop", killAnvilCommand)
.command("anvil:setup", anvilSetupCommand)
.command("generate:contracts", generateCommand)
.command("deploy:contracts", deployCommand);