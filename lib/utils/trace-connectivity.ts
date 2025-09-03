import { su } from "@tscircuit/soup-util";

/**
 * Finds all schematic traces that are electrically connected to the given trace
 * @param circuitJson The circuit JSON data
 * @param hoveredSchematicTraceId The ID of the trace being hovered
 * @returns Array of connected trace IDs (including the original trace)
 */
export const findConnectedTraceIds = (
  circuitJson: any[],
  hoveredSchematicTraceId: string
): string[] => {
  try {
    const soup = su(circuitJson);

    const schematicTrace = soup.schematic_trace.get(hoveredSchematicTraceId);
    if (!schematicTrace) {
      return [hoveredSchematicTraceId];
    }

    const allSchematicTraces = soup.schematic_trace.list();
    const allSourceTraces = soup.source_trace.list();

    let sourceTrace = soup.source_trace.get(schematicTrace.source_trace_id);

    // Fallback: find by index if ID mismatch
    if (!sourceTrace) {
      const schematicTraceIndex = parseInt(
        hoveredSchematicTraceId.split("_").pop() || "0"
      );
      if (schematicTraceIndex < allSourceTraces.length) {
        sourceTrace = allSourceTraces[schematicTraceIndex];
      }
    }

    if (!sourceTrace) {
      return [hoveredSchematicTraceId];
    }

    const connectedTraceIds = new Set<string>([hoveredSchematicTraceId]);

    // Find traces with same connectivity key
    const connectivityKey = sourceTrace.subcircuit_connectivity_map_key;
    if (connectivityKey) {
      for (const otherSourceTrace of allSourceTraces) {
        if (otherSourceTrace.subcircuit_connectivity_map_key === connectivityKey) {
          const sourceTraceIndex = allSourceTraces.findIndex(
            (st) => st.source_trace_id === otherSourceTrace.source_trace_id
          );
          if (sourceTraceIndex >= 0 && sourceTraceIndex < allSchematicTraces.length) {
            const mappedSchematicTrace = allSchematicTraces[sourceTraceIndex];
            connectedTraceIds.add(mappedSchematicTrace.schematic_trace_id);
          }
        }
      }
    }

    return Array.from(connectedTraceIds);
  } catch (error) {
    return [hoveredSchematicTraceId];
  }
};
