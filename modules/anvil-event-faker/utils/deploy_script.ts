import { Contract } from "./types.ts";

function toSolidityAddressLiteral(address: string): string {
  if (!address || !address.startsWith("0x")) return "address(0)";
  return address;
}

export function buildDeployScript(_projectName: string, contracts: Contract[]): string {
  const contractDeclares = contracts
    .map((c) => `    ${c.name} ${c.name.toLowerCase()};`)
    .join("\n");

  const deployments = contracts
    .map((c) => {
      const varName = c.name.toLowerCase();
      const target = toSolidityAddressLiteral(c.address);
      return [
        `        ${varName} = new ${c.name}();`,
        `        // Etch deployed bytecode at the target address to mirror subgraph address`,
        `        vm.etch(${target}, address(${varName}).code);`,
      ].join("\n");
    })
    .join("\n\n");

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

${contracts.map((c) => `import { ${c.name} } from "../src/${c.name}.sol";`).join("\n")}

contract DeployFakes is Script {
${contractDeclares}

    function run() external {
        vm.startBroadcast();
${deployments}
        vm.stopBroadcast();
    }
}
`;
}


