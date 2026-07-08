import type { CircuitJson } from "circuit-json"

class DisjointSet {
  private parent = new Map<string, string>()

  add(id: string) {
    if (!this.parent.has(id)) this.parent.set(id, id)
  }

  find(id: string): string {
    this.add(id)
    const parent = this.parent.get(id)!
    if (parent === id) return id
    const root = this.find(parent)
    this.parent.set(id, root)
    return root
  }

  union(a: string, b: string) {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA !== rootB) this.parent.set(rootB, rootA)
  }
}

const getStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []

export const getSourceTraceNetKeyMap = (circuitJson: CircuitJson) => {
  const disjointSet = new DisjointSet()
  const sourceTraceIds: string[] = []

  for (const element of circuitJson as Array<Record<string, unknown>>) {
    if (element.type !== "source_trace") continue

    const sourceTraceId = element.source_trace_id
    if (typeof sourceTraceId !== "string") continue

    sourceTraceIds.push(sourceTraceId)
    disjointSet.add(sourceTraceId)

    const connectedIds = [
      ...getStringArray(element.connected_source_port_ids),
      ...getStringArray(element.connected_source_net_ids),
    ]

    const subcircuitConnectivityMapKey =
      typeof element.subcircuit_connectivity_map_key === "string"
        ? element.subcircuit_connectivity_map_key
        : null

    if (subcircuitConnectivityMapKey) {
      connectedIds.push(`subcircuit:${subcircuitConnectivityMapKey}`)
    }

    for (const connectedId of connectedIds) {
      disjointSet.union(sourceTraceId, connectedId)
    }
  }

  return new Map(
    sourceTraceIds.map((sourceTraceId) => [
      sourceTraceId,
      disjointSet.find(sourceTraceId),
    ]),
  )
}

export const getSchematicTraceNetKeyMap = (circuitJson: CircuitJson) => {
  const sourceTraceNetKeyMap = getSourceTraceNetKeyMap(circuitJson)
  const schematicTraceNetKeyMap = new Map<string, string>()

  for (const element of circuitJson as Array<Record<string, unknown>>) {
    if (element.type !== "schematic_trace") continue

    const schematicTraceId = element.schematic_trace_id
    const sourceTraceId = element.source_trace_id
    if (
      typeof schematicTraceId !== "string" ||
      typeof sourceTraceId !== "string"
    ) {
      continue
    }

    const netKey = sourceTraceNetKeyMap.get(sourceTraceId)
    if (netKey) schematicTraceNetKeyMap.set(schematicTraceId, netKey)
  }

  return schematicTraceNetKeyMap
}

export const getSameNetSchematicTraceIdsMap = (circuitJson: CircuitJson) => {
  const schematicTraceNetKeyMap = getSchematicTraceNetKeyMap(circuitJson)
  const netKeyToTraceIds = new Map<string, Set<string>>()

  for (const [traceId, netKey] of schematicTraceNetKeyMap) {
    let traceIds = netKeyToTraceIds.get(netKey)
    if (!traceIds) {
      traceIds = new Set()
      netKeyToTraceIds.set(netKey, traceIds)
    }
    traceIds.add(traceId)
  }

  const sameNetTraceIdsByTraceId = new Map<string, Set<string>>()
  for (const [traceId, netKey] of schematicTraceNetKeyMap) {
    const sameNet = netKeyToTraceIds.get(netKey)!
    sameNetTraceIdsByTraceId.set(traceId, sameNet)
  }

  return sameNetTraceIdsByTraceId
}
