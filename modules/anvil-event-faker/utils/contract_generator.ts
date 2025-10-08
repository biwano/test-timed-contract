import { Contract, Event } from "./subgraph_parser.ts";

export function generateFakeContract(contract: Contract): string {
  const contractName = contract.name;
  const events = contract.events;
  
  let solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ${contractName}Fake
 * @dev Fake contract that emits events for testing purposes
 * Generated from subgraph definition
 */
contract ${contractName}Fake {
`;

  // Add events
  for (const event of events) {
    solidityCode += `    event ${event.name}(${formatEventParameters(event.inputs)});\n`;
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
      return `${indexed}${input.type} ${input.name}`;
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
