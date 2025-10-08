import { exists } from "std/fs/exists.ts";
import { validateRegistry } from "../utils/registry.ts";

export async function deployForProjectTask(projectDir: string, rpcUrl: string, privateKey: string): Promise<void> {
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
  console.log(`✅ Deployment script executed successfully for project: ${projectDir}.`);
}

export async function deployAllProjectsTask(rpcUrl: string, privateKey: string): Promise<void> {
  const registry = await validateRegistry();
  const projectNames = Object.keys(registry);

  for (const projectName of projectNames) {
    const projectDir = `./foundry/${projectName}`;
    await deployForProjectTask(projectDir, rpcUrl, privateKey);
  }
}


