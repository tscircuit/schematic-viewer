import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

/**
 * Finds all schematic traces electrically connected to the hovered trace.
 * Uses source_net as the source of truth for electrical connectivity.
 * 
 * Algorithm:
 * 1. Get schematic_trace by ID
 * 2. Find its source_trace
 * 3. Get connected_source_net_ids from source_trace
 * 4. Find ALL source_traces that share ANY of these net IDs
 * 5. Map back to schematic_trace_ids
 * 
 * @param circuitJson - Circuit JSON soup data
 * @param hoveredSchematicTraceId - The schematic_trace_id being hovered
 * @returns Array of all connected schematic_trace_ids (including hovered)
 */
export const findConnectedTraceIds = (
  circuitJson: CircuitJson,
  hoveredSchematicTraceId: string
): string[] => {
  try {
    const soup = su(circuitJson)
    
    // STEP 1: Get the hovered schematic trace
    const hoveredSchematicTrace = soup.schematic_trace.get(hoveredSchematicTraceId)
    if (!hoveredSchematicTrace) {
      return [hoveredSchematicTraceId]
    }
    
    // STEP 2: Get the corresponding source_trace
    const hoveredSourceTrace = soup.source_trace.get(
      hoveredSchematicTrace.source_trace_id
    )
    if (!hoveredSourceTrace) {
      return [hoveredSchematicTraceId]
    }
    
    // STEP 3: Get all net IDs this trace belongs to (THE KEY!)
    const connectedNetIds = hoveredSourceTrace.connected_source_net_ids || []
    if (connectedNetIds.length === 0) {
      return [hoveredSchematicTraceId]
    }
    
    // STEP 4: Find ALL source_traces that share ANY of these nets
    const allSourceTraces = soup.source_trace.list()
    const connectedSourceTraceIds = new Set<string>()
    
    for (const sourceTrace of allSourceTraces) {
      const sourceTraceNetIds = sourceTrace.connected_source_net_ids || []
      
      // Check if this source_trace shares any net with our hovered trace
      const sharesNet = sourceTraceNetIds.some((netId) =>
        connectedNetIds.includes(netId)
      )
      
      if (sharesNet) {
        connectedSourceTraceIds.add(sourceTrace.source_trace_id)
      }
    }
    
    // STEP 5: Map source_trace_ids back to schematic_trace_ids
    const allSchematicTraces = soup.schematic_trace.list()
    const connectedSchematicTraceIds = new Set<string>([hoveredSchematicTraceId])
    
    for (const schematicTrace of allSchematicTraces) {
      if (connectedSourceTraceIds.has(schematicTrace.source_trace_id)) {
        connectedSchematicTraceIds.add(schematicTrace.schematic_trace_id)
      }
    }
    
    return Array.from(connectedSchematicTraceIds)
    
  } catch (error) {
    console.error("[trace-connectivity] Error finding connected traces:", error)
    return [hoveredSchematicTraceId]
  }
}