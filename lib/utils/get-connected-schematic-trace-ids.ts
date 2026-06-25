import type { CircuitJson } from "circuit-json"

type CircuitElement = CircuitJson[number] & Record<string, unknown>

const getStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

const getElementId = (element: CircuitElement, key: string): string | null => {
  const value = element[key]
  return typeof value === "string" ? value : null
}

const getSourceTraceConnectivityKeys = (sourceTrace: CircuitElement) => [
  ...getStringList(sourceTrace.connected_source_port_ids).map(
    (portId) => `port:${portId}`,
  ),
  ...getStringList(sourceTrace.connected_source_net_ids).map(
    (netId) => `net:${netId}`,
  ),
]

export const getConnectedSchematicTraceIdsByTraceId = (
  circuitJson: CircuitJson,
): Map<string, Set<string>> => {
  const schematicTraces = circuitJson.filter(
    (element): element is CircuitElement =>
      (element as CircuitElement).type === "schematic_trace",
  )
  const sourceTraces = circuitJson.filter(
    (element): element is CircuitElement =>
      (element as CircuitElement).type === "source_trace",
  )

  const sourceTraceById = new Map<string, CircuitElement>()
  const connectivityKeysBySourceTraceId = new Map<string, string[]>()
  const sourceTraceIdsByConnectivityKey = new Map<string, Set<string>>()
  const schematicTraceIdsBySourceTraceId = new Map<string, Set<string>>()
  const connectedIdsBySchematicTraceId = new Map<string, Set<string>>()

  for (const sourceTrace of sourceTraces) {
    const sourceTraceId = getElementId(sourceTrace, "source_trace_id")
    if (!sourceTraceId) continue

    sourceTraceById.set(sourceTraceId, sourceTrace)

    const connectivityKeys = getSourceTraceConnectivityKeys(sourceTrace)
    connectivityKeysBySourceTraceId.set(sourceTraceId, connectivityKeys)

    for (const key of connectivityKeys) {
      const traceIds =
        sourceTraceIdsByConnectivityKey.get(key) ?? new Set<string>()
      traceIds.add(sourceTraceId)
      sourceTraceIdsByConnectivityKey.set(key, traceIds)
    }
  }

  for (const schematicTrace of schematicTraces) {
    const schematicTraceId = getElementId(schematicTrace, "schematic_trace_id")
    const sourceTraceId = getElementId(schematicTrace, "source_trace_id")

    if (!schematicTraceId) continue

    if (!sourceTraceId) {
      connectedIdsBySchematicTraceId.set(
        schematicTraceId,
        new Set([schematicTraceId]),
      )
      continue
    }

    const traceIds =
      schematicTraceIdsBySourceTraceId.get(sourceTraceId) ?? new Set<string>()
    traceIds.add(schematicTraceId)
    schematicTraceIdsBySourceTraceId.set(sourceTraceId, traceIds)
  }

  const visitedSourceTraceIds = new Set<string>()

  for (const sourceTraceId of sourceTraceById.keys()) {
    if (visitedSourceTraceIds.has(sourceTraceId)) continue

    const connectedSourceTraceIds = new Set<string>()
    const sourceTraceIdsToVisit = [sourceTraceId]

    while (sourceTraceIdsToVisit.length > 0) {
      const currentSourceTraceId = sourceTraceIdsToVisit.pop()
      if (
        !currentSourceTraceId ||
        visitedSourceTraceIds.has(currentSourceTraceId)
      ) {
        continue
      }

      visitedSourceTraceIds.add(currentSourceTraceId)
      connectedSourceTraceIds.add(currentSourceTraceId)

      const connectivityKeys =
        connectivityKeysBySourceTraceId.get(currentSourceTraceId) ?? []

      for (const key of connectivityKeys) {
        const nextSourceTraceIds = sourceTraceIdsByConnectivityKey.get(key)
        if (!nextSourceTraceIds) continue

        for (const nextSourceTraceId of nextSourceTraceIds) {
          if (!visitedSourceTraceIds.has(nextSourceTraceId)) {
            sourceTraceIdsToVisit.push(nextSourceTraceId)
          }
        }
      }
    }

    const connectedSchematicTraceIds = new Set<string>()

    for (const connectedSourceTraceId of connectedSourceTraceIds) {
      const schematicTraceIds =
        schematicTraceIdsBySourceTraceId.get(connectedSourceTraceId) ??
        new Set<string>()

      for (const schematicTraceId of schematicTraceIds) {
        connectedSchematicTraceIds.add(schematicTraceId)
      }
    }

    for (const connectedSourceTraceId of connectedSourceTraceIds) {
      const schematicTraceIds =
        schematicTraceIdsBySourceTraceId.get(connectedSourceTraceId) ??
        new Set<string>()

      for (const schematicTraceId of schematicTraceIds) {
        connectedIdsBySchematicTraceId.set(
          schematicTraceId,
          connectedSchematicTraceIds,
        )
      }
    }
  }

  for (const schematicTrace of schematicTraces) {
    const schematicTraceId = getElementId(schematicTrace, "schematic_trace_id")

    if (!schematicTraceId) continue
    if (!connectedIdsBySchematicTraceId.has(schematicTraceId)) {
      connectedIdsBySchematicTraceId.set(
        schematicTraceId,
        new Set([schematicTraceId]),
      )
    }
  }

  return connectedIdsBySchematicTraceId
}
