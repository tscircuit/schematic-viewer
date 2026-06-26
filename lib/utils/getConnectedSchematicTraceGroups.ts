import { su } from "@tscircuit/soup-util"
import type {
  CircuitJson,
  Point as CircuitPoint,
  SchematicTrace,
  SourcePort,
} from "circuit-json"

const FALLBACK_GROUP_PREFIX = "schematic_trace_group"
const POINT_PRECISION = 6

const toPointKey = (point: CircuitPoint) => {
  const x = Number(point.x.toFixed(POINT_PRECISION))
  const y = Number(point.y.toFixed(POINT_PRECISION))
  return `${x},${y}`
}

const sortUnique = (items: Iterable<string>) =>
  Array.from(new Set(items)).sort()

const getTracePointKeys = (trace: SchematicTrace) => {
  const pointKeys = new Set<string>()

  for (const edge of trace.edges ?? []) {
    if (edge.from) pointKeys.add(toPointKey(edge.from))
    if (edge.to) pointKeys.add(toPointKey(edge.to))
  }

  for (const junction of trace.junctions ?? []) {
    pointKeys.add(toPointKey(junction))
  }

  return pointKeys
}

export const getConnectedSchematicTraceGroups = (
  circuitJson: CircuitJson,
): Record<string, string[]> => {
  const groupKeysByTraceId = getSchematicTraceGroupKeys(circuitJson)
  const traceIdsByGroupKey = new Map<string, string[]>()

  for (const [traceId, groupKey] of Object.entries(groupKeysByTraceId)) {
    if (!traceIdsByGroupKey.has(groupKey)) {
      traceIdsByGroupKey.set(groupKey, [])
    }
    traceIdsByGroupKey.get(groupKey)?.push(traceId)
  }

  const groupsByTraceId: Record<string, string[]> = {}
  for (const [traceId, groupKey] of Object.entries(groupKeysByTraceId)) {
    groupsByTraceId[traceId] = sortUnique(
      traceIdsByGroupKey.get(groupKey) ?? [],
    )
  }

  return groupsByTraceId
}

export const getSchematicTraceGroupKeys = (
  circuitJson: CircuitJson,
): Record<string, string> => {
  const schematicTraces = su(
    circuitJson,
  ).schematic_trace.list() as SchematicTrace[]
  const schematicPorts = su(circuitJson).schematic_port.list()
  const sourcePorts = su(circuitJson).source_port.list()

  const connectivityKeysByPoint = new Map<string, Set<string>>()
  const sourcePortById = new Map<string, SourcePort>(
    sourcePorts.map((sourcePort) => [
      sourcePort.source_port_id as string,
      sourcePort as SourcePort,
    ]),
  )

  for (const schematicPort of schematicPorts) {
    if (!schematicPort.center || !schematicPort.source_port_id) continue

    const sourcePort = sourcePortById.get(schematicPort.source_port_id)
    const connectivityKey = sourcePort?.subcircuit_connectivity_map_key
    if (!connectivityKey) continue

    const pointKey = toPointKey(schematicPort.center)
    if (!connectivityKeysByPoint.has(pointKey)) {
      connectivityKeysByPoint.set(pointKey, new Set())
    }
    connectivityKeysByPoint.get(pointKey)?.add(connectivityKey)
  }

  const traceIdsByPoint = new Map<string, Set<string>>()
  const pointKeysByTraceId = new Map<string, string[]>()
  const schematicTraceById = new Map<string, SchematicTrace>()

  for (const trace of schematicTraces) {
    const traceId = trace.schematic_trace_id
    if (!traceId) continue

    const pointKeys = sortUnique(getTracePointKeys(trace))
    schematicTraceById.set(traceId, trace)
    pointKeysByTraceId.set(traceId, pointKeys)

    for (const pointKey of pointKeys) {
      if (!traceIdsByPoint.has(pointKey)) {
        traceIdsByPoint.set(pointKey, new Set())
      }
      traceIdsByPoint.get(pointKey)?.add(traceId)
    }
  }

  const groupKeysByTraceId: Record<string, string> = {}
  const visitedTraceIds = new Set<string>()
  let fallbackGroupIndex = 0

  for (const trace of schematicTraces) {
    const startTraceId = trace.schematic_trace_id
    if (!startTraceId || visitedTraceIds.has(startTraceId)) continue

    const queue = [startTraceId]
    const connectedTraceIds = new Set<string>()
    const componentConnectivityKeys = new Set<string>()

    while (queue.length > 0) {
      const currentTraceId = queue.shift()
      if (!currentTraceId || visitedTraceIds.has(currentTraceId)) continue

      visitedTraceIds.add(currentTraceId)
      connectedTraceIds.add(currentTraceId)

      const currentTrace = schematicTraceById.get(currentTraceId)
      if (currentTrace?.subcircuit_connectivity_map_key) {
        componentConnectivityKeys.add(
          currentTrace.subcircuit_connectivity_map_key,
        )
      }

      for (const pointKey of pointKeysByTraceId.get(currentTraceId) ?? []) {
        for (const connectivityKey of connectivityKeysByPoint.get(pointKey) ??
          []) {
          componentConnectivityKeys.add(connectivityKey)
        }

        for (const neighborTraceId of traceIdsByPoint.get(pointKey) ?? []) {
          if (!visitedTraceIds.has(neighborTraceId)) {
            queue.push(neighborTraceId)
          }
        }
      }
    }

    if (componentConnectivityKeys.size > 1) {
      console.warn(
        "Multiple connectivity keys found for schematic trace group",
        sortUnique(componentConnectivityKeys),
        sortUnique(connectedTraceIds),
      )
    }

    const groupKey =
      sortUnique(componentConnectivityKeys)[0] ??
      `${FALLBACK_GROUP_PREFIX}_${fallbackGroupIndex++}`

    for (const traceId of connectedTraceIds) {
      groupKeysByTraceId[traceId] = groupKey
    }
  }

  return groupKeysByTraceId
}

export const addConnectivityKeysToSchematicTraces = (
  circuitJson: CircuitJson,
): CircuitJson => {
  const groupKeysByTraceId = getSchematicTraceGroupKeys(circuitJson)

  return circuitJson.map((entry) => {
    if (entry.type !== "schematic_trace" || !entry.schematic_trace_id) {
      return entry
    }

    const subcircuitConnectivityMapKey =
      groupKeysByTraceId[entry.schematic_trace_id] ??
      entry.subcircuit_connectivity_map_key

    if (!subcircuitConnectivityMapKey) {
      return entry
    }

    return {
      ...entry,
      subcircuit_connectivity_map_key: subcircuitConnectivityMapKey,
    }
  }) as CircuitJson
}
