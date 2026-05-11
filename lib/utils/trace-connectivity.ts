import type { CircuitJson } from "circuit-json"

type CircuitElement = CircuitJson[number] & Record<string, any>

const listByType = (circuitJson: CircuitJson, type: string) =>
  (circuitJson as CircuitElement[]).filter((element) => element.type === type)

const valuesIntersect = (a: Set<string>, b: Set<string>) => {
  for (const value of a) {
    if (b.has(value)) return true
  }
  return false
}

const collectSourceTraceKeys = (sourceTrace: CircuitElement | undefined) => {
  const keys = new Set<string>()
  if (!sourceTrace) return keys

  for (const sourceNetId of sourceTrace.connected_source_net_ids ?? []) {
    keys.add(`source_net:${sourceNetId}`)
  }

  if (sourceTrace.subcircuit_connectivity_map_key) {
    keys.add(`connectivity:${sourceTrace.subcircuit_connectivity_map_key}`)
  }

  return keys
}

const collectSchematicPortIds = (schematicTrace: CircuitElement) => {
  const portIds = new Set<string>()

  for (const edge of schematicTrace.edges ?? []) {
    if (edge.from_schematic_port_id) portIds.add(edge.from_schematic_port_id)
    if (edge.to_schematic_port_id) portIds.add(edge.to_schematic_port_id)
  }

  return portIds
}

const collectConnectedSourceTraceIdsByPorts = (
  sourceTraces: CircuitElement[],
  hoveredSourceTrace: CircuitElement,
) => {
  const connectedSourceTraceIds = new Set<string>([
    hoveredSourceTrace.source_trace_id,
  ])
  const connectedSourcePortIds = new Set<string>(
    hoveredSourceTrace.connected_source_port_ids ?? [],
  )

  let changed = true
  while (changed) {
    changed = false

    for (const sourceTrace of sourceTraces) {
      if (connectedSourceTraceIds.has(sourceTrace.source_trace_id)) continue

      const sourcePortIds = new Set<string>(
        sourceTrace.connected_source_port_ids ?? [],
      )
      if (!valuesIntersect(connectedSourcePortIds, sourcePortIds)) continue

      connectedSourceTraceIds.add(sourceTrace.source_trace_id)
      for (const sourcePortId of sourcePortIds) {
        connectedSourcePortIds.add(sourcePortId)
      }
      changed = true
    }
  }

  return connectedSourceTraceIds
}

export const getConnectedSchematicTraceIds = (
  circuitJson: CircuitJson,
  hoveredSchematicTraceId: string,
) => {
  const schematicTraces = listByType(circuitJson, "schematic_trace")
  const sourceTraces = listByType(circuitJson, "source_trace")
  const sourceTraceById = new Map(
    sourceTraces.map((sourceTrace) => [
      sourceTrace.source_trace_id,
      sourceTrace,
    ]),
  )

  const hoveredSchematicTrace = schematicTraces.find(
    (schematicTrace) =>
      schematicTrace.schematic_trace_id === hoveredSchematicTraceId,
  )
  if (!hoveredSchematicTrace) return [hoveredSchematicTraceId]

  const connectedSchematicTraceIds = new Set<string>([hoveredSchematicTraceId])
  const hoveredSourceTrace = sourceTraceById.get(
    hoveredSchematicTrace.source_trace_id,
  )
  const hoveredSourceTraceKeys = collectSourceTraceKeys(hoveredSourceTrace)

  if (hoveredSourceTraceKeys.size > 0) {
    for (const schematicTrace of schematicTraces) {
      const sourceTrace = sourceTraceById.get(schematicTrace.source_trace_id)
      if (
        valuesIntersect(
          hoveredSourceTraceKeys,
          collectSourceTraceKeys(sourceTrace),
        )
      ) {
        connectedSchematicTraceIds.add(schematicTrace.schematic_trace_id)
      }
    }
  } else if (hoveredSourceTrace) {
    const connectedSourceTraceIds = collectConnectedSourceTraceIdsByPorts(
      sourceTraces,
      hoveredSourceTrace,
    )
    for (const schematicTrace of schematicTraces) {
      if (connectedSourceTraceIds.has(schematicTrace.source_trace_id)) {
        connectedSchematicTraceIds.add(schematicTrace.schematic_trace_id)
      }
    }
  } else if (hoveredSchematicTrace.source_trace_id) {
    for (const schematicTrace of schematicTraces) {
      if (
        schematicTrace.source_trace_id === hoveredSchematicTrace.source_trace_id
      ) {
        connectedSchematicTraceIds.add(schematicTrace.schematic_trace_id)
      }
    }
  }

  const hoveredSchematicPortIds = collectSchematicPortIds(hoveredSchematicTrace)
  if (hoveredSchematicPortIds.size > 0) {
    let changed = true
    while (changed) {
      changed = false

      for (const schematicTrace of schematicTraces) {
        if (connectedSchematicTraceIds.has(schematicTrace.schematic_trace_id)) {
          continue
        }

        const schematicPortIds = collectSchematicPortIds(schematicTrace)
        if (!valuesIntersect(hoveredSchematicPortIds, schematicPortIds)) {
          continue
        }

        connectedSchematicTraceIds.add(schematicTrace.schematic_trace_id)
        for (const schematicPortId of schematicPortIds) {
          hoveredSchematicPortIds.add(schematicPortId)
        }
        changed = true
      }
    }
  }

  return schematicTraces
    .map((schematicTrace) => schematicTrace.schematic_trace_id)
    .filter((schematicTraceId) =>
      connectedSchematicTraceIds.has(schematicTraceId),
    )
}
