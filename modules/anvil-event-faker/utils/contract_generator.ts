import { Contract } from "./types.ts";

export function generateFakeContract(contract: Contract): string {
  const contractName = contract.name;
  const events = contract.events;
  
  let solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ${contractName}
 * @dev Fake contract that emits events for testing purposes
 * Generated from subgraph definition
 */
contract ${contractName} {
`;

  // Add events
  for (const event of events) {
    solidityCode += `    event ${event.name}(${formatEventParameters(event.inputs as Array<{ name: string; type: string; indexed?: boolean }>)});\n`;
  }
  
  solidityCode += "\n";
  
  // Add functions that emit events
  for (const event of events) {
    const functionName = `emit${capitalizeFirst(event.name)}`;
    const parameters = formatFunctionParameters(event.inputs);
    const emitCall = `emit ${event.name}(${formatEmitArguments(event.inputs)});`;
    
    solidityCode += `    function ${functionName}(${parameters}) external {\n`;
    solidityCode += `        ${emitCall}\n`;
    solidityCode += `    }\n\n`;
  }
  
  solidityCode += "}\n";
  
  return solidityCode;
}

function formatEventParameters(inputs: Array<{ name: string; type: string; indexed?: boolean }>): string {
  return inputs
    .map(input => {
      const indexed = input.indexed ? "indexed " : "";
      // Solidity expects: type indexed name
      return `${input.type} ${indexed}${input.name}`;
    })
    .join(", ");
}

function formatFunctionParameters(inputs: Array<{ name: string; type: string; indexed?: boolean }>): string {
  return inputs
    .map(input => `${input.type} ${input.name}`)
    .join(", ");
}

function formatEmitArguments(inputs: Array<{ name: string; type: string; indexed?: boolean }>): string {
  return inputs
    .map(input => input.name)
    .join(", ");
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
