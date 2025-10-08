import { parse as parseYaml } from "https://deno.land/std@0.208.0/yaml/mod.ts";

export interface Event {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    indexed?: boolean;
  }>;
}

export interface Contract {
  name: string;
  address: string;
  abi: Array<{
    type: string;
    name?: string;
    inputs?: Array<{
      name: string;
      type: string;
      indexed?: boolean;
    }>;
  }>;
  events: Event[];
}

export interface SubgraphData {
  contracts: Contract[];
}

export async function parseSubgraph(subgraphPath: string): Promise<SubgraphData> {
  try {
    const subgraphContent = await Deno.readTextFile(subgraphPath);
    const subgraph = parseYaml(subgraphContent) as any;
    
    const contracts: Contract[] = [];
    
    // Parse data sources from subgraph
    if (subgraph.dataSources) {
      for (const source of subgraph.dataSources) {
        if (source.mapping && source.mapping.abis) {
          for (const abiRef of source.mapping.abis) {
            const abiName = abiRef.name;
            const abiPath = abiRef.file;
            
            // Read ABI file
            const abiContent = await Deno.readTextFile(abiPath);
            const abi = JSON.parse(abiContent);
            
            // Extract events from ABI
            const events = abi
              .filter((item: any) => item.type === 'event')
              .map((event: any) => ({
                name: event.name,
                inputs: event.inputs || []
              }));
            
            if (events.length > 0) {
              contracts.push({
                name: abiName,
                address: source.source.address || "0x0000000000000000000000000000000000000000",
                abi: abi,
                events: events
              });
            }
          }
        }
      }
    }
    
    return { contracts };
    
  } catch (error) {
    throw new Error(`Failed to parse subgraph: ${error.message}`);
  }
}
