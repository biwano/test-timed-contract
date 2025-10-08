import { parse as parseYaml } from "https://deno.land/std@0.208.0/yaml/mod.ts";
import { ParseAbiItem, parseAbiItem } from "https://esm.sh/viem@2.0.0";

export type ParsedEvent = ParseAbiItem<string>;

export interface Contract {
  name: string;
  address: string;
  events: ParsedEvent[];
}

export interface SubgraphData {
  contracts: Contract[];
}

export async function parseSubgraph(subgraphPath: string): Promise<SubgraphData> {
  try {
    const subgraphContent = await Deno.readTextFile(subgraphPath);
        const subgraph = parseYaml(subgraphContent) as Record<string, unknown>;
    
    const contracts: Contract[] = [];
    
    // Parse data sources from subgraph
    if (subgraph.dataSources && Array.isArray(subgraph.dataSources)) {
      for (const source of subgraph.dataSources as Record<string, unknown>[]) {
        const mapping = source.mapping as Record<string, unknown>;
        if (mapping && mapping.eventHandlers && Array.isArray(mapping.eventHandlers)) {
          const contractName = source.name as string;
          const events: ParsedEvent[] = [];
          
          // Extract events from eventHandlers
          for (const handler of mapping.eventHandlers as Record<string, unknown>[]) {
            const eventSignature = handler.event as string;
            
            try {
              // Use viem to parse the event signature
              const parsed = parseAbiItem(`event ${eventSignature}`);
              if (parsed && parsed.type === 'event') {
                events.push(parsed);
              }
            } catch (error) {
              console.warn(`Failed to parse event signature: ${eventSignature}`, error);
              // Skip un-parseable events
            }
          }
          
          if (events.length > 0) {
            const sourceObj = source.source as Record<string, unknown>;
            contracts.push({
              name: contractName,
              address: (sourceObj.address as string) || "0x0000000000000000000000000000000000000000",
              events: events
            });
          }
        }
      }
    }
    
    return { contracts };
    
  } catch (error) {
    throw new Error(`Failed to parse subgraph: ${error instanceof Error ? error.message : String(error)}`);
  }
}
