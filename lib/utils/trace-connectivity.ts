import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

export const findConnectedTraceIds = (
  circuitJson: CircuitJson,
  hoveredSchematicTraceId: string,
): string[] => {
  try {
    const soup = su(circuitJson)
    const hoveredSchematicTrace = soup.schematic_trace.get(
      hoveredSchematicTraceId,
    )
    if (!hoveredSchematicTrace?.source_trace_id)
      return [hoveredSchematicTraceId]

    const hoveredSourceTrace = soup.source_trace.get(
      hoveredSchematicTrace.source_trace_id,
    )
    if (!hoveredSourceTrace) return [hoveredSchematicTraceId]

    const connectedNetIds = hoveredSourceTrace.connected_source_net_ids ?? []
    if (connectedNetIds.length === 0) return [hoveredSchematicTraceId]

    const allSourceTraces = soup.source_trace.list()
    const connectedSourceTraceIds = new Set<string>()

    for (const sourceTrace of allSourceTraces) {
      const netIds = sourceTrace.connected_source_net_ids ?? []
      if (netIds.some((id) => connectedNetIds.includes(id))) {
        connectedSourceTraceIds.add(sourceTrace.source_trace_id)
      }
    }

    const allSchematicTraces = soup.schematic_trace.list()
    const result = new Set<string>([hoveredSchematicTraceId])
    for (const st of allSchematicTraces) {
      if (
        st.source_trace_id &&
        connectedSourceTraceIds.has(st.source_trace_id)
      ) {
        result.add(st.schematic_trace_id)
      }
    }
    return Array.from(result)
  } catch {
    return [hoveredSchematicTraceId]
  }
}
