import { Command } from "cliffy/command";
import { exists } from "std/fs/exists.ts";
import { ANVIL_DEFAULT_PRIVATE_KEY, ANVIL_DEFAULT_RPC_URL, FOUNDRY_ROOT, REGISTRY_PATH } from "../utils/constants.ts";

async function deployForProject(projectName: string, rpcUrl: string, privateKey: string): Promise<void> {
  const projectDir = `${FOUNDRY_ROOT}/${projectName}`;
  const scriptPath = `${projectDir}/script/Deploy.s.sol`;

  if (!(await exists(projectDir))) {
    console.log(`Skipping: project directory not found: ${projectDir}.`);
    return;
  }
  if (!(await exists(scriptPath))) {
    console.log(`Skipping: deployment script not found: ${scriptPath}.`);
    return;
  }

  const originalCwd = Deno.cwd();
  Deno.chdir(projectDir);

  const cmd = new Deno.Command("forge", {
    args: [
      "script",
      "script/Deploy.s.sol",
      "--rpc-url",
      rpcUrl,
      "--broadcast",
      "--private-key",
      privateKey,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await cmd.output();
  Deno.chdir(originalCwd);

  if (code !== 0) {
    throw new Error(new TextDecoder().decode(stderr));
  }

  console.log(new TextDecoder().decode(stdout));
  console.log(`✅ Deployment script executed successfully for project: ${projectName}.`);
}

export const deployCommand = new Command()
  .name("contracts:deploy")
  .description("Deploy generated fake contracts on the local Anvil fork using Foundry script")
  .action(async () => {
    const registryPath = REGISTRY_PATH;
    const defaultRpcUrl = ANVIL_DEFAULT_RPC_URL;
    const defaultPrivateKey = ANVIL_DEFAULT_PRIVATE_KEY; // anvil default 0 key

    try {
      const registryContent = await Deno.readTextFile(registryPath);
      const registry = JSON.parse(registryContent) as Record<string, { subgraph_path: string }>;
      const projectNames = Object.keys(registry);
      if (projectNames.length === 0) {
        console.log("No projects found in registry. Run 'subgraph:add' first.");
        return;
      }

      for (const projectName of projectNames) {
        await deployForProject(projectName, defaultRpcUrl, defaultPrivateKey);
      }
    } catch (error) {
      console.error("Error deploying fakes:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


