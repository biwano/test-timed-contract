import { Command } from "cliffy/command";
import { exists } from "std/fs/exists.ts";

export const deployCommand = new Command()
  .name("deploy")
  .description("Deploy generated fake contracts on the local Anvil fork using Foundry script")
  .option("-n, --name <name>", "Name of the folder containing the foundry project", { default: "foundry" })
  .option("--rpc-url <url>", "RPC URL for the local fork", { default: "http://localhost:8545" })
  .option("--pk <hex>", "Private key to broadcast transactions (defaults to first Anvil key)")
  .action(async (options: { name: string; rpcUrl: string; pk?: string }) => {
    const projectDir = `./${options.name}`;
    const scriptPath = `${projectDir}/script/Deploy.s.sol`;

    try {
      if (!(await exists(projectDir))) {
        throw new Error(`Project directory not found: ${projectDir}. Run 'generate --name ${options.name}' first.`);
      }
      if (!(await exists(scriptPath))) {
        throw new Error(`Deployment script not found: ${scriptPath}. Run 'generate --name ${options.name}' first.`);
      }

      const privateKey = options.pk ?? Deno.env.get("ANVIL_PK") ??
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // anvil default 0 key

      const originalCwd = Deno.cwd();
      Deno.chdir(projectDir);

      const cmd = new Deno.Command("forge", {
        args: [
          "script",
          "script/Deploy.s.sol",
          "--rpc-url",
          options.rpcUrl,
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
      console.log("✅ Deployment script executed successfully.");
    } catch (error) {
      console.error("Error deploying fakes:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


