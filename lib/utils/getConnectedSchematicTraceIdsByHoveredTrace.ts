import type { CircuitJson } from "circuit-json"

type CircuitJsonElement = Record<string, any>

const addToSetMap = (
  map: Map<string, Set<string>>,
  key: string | undefined,
  value: string | undefined,
) => {
  if (!key || !value) return
  const values = map.get(key) ?? new Set<string>()
  values.add(value)
  map.set(key, values)
}

const getElementsByType = (circuitJson: CircuitJson, type: string) =>
  (circuitJson as CircuitJsonElement[]).filter((elm) => elm.type === type)

const getStringArray = (value: any) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []

const normalizeSelector = (selector: string) =>
  selector
    .trim()
    .replace(/^\.*/, "")
    .replace(/\s*>\s*/g, ".")
    .replace(/\s+/g, ".")
    .replace(/^\.+|\.+$/g, "")

const getSourcePortSelectorsFromSolverTraceId = (sourceTraceId: string) => {
  if (!sourceTraceId.startsWith("solver_")) return []
  return sourceTraceId
    .replace(/^solver_/, "")
    .split("-")
    .map(normalizeSelector)
    .filter(Boolean)
}

const addTraceConnectivityKey = (
  traceIdToKeys: Map<string, Set<string>>,
  keyToTraceIds: Map<string, Set<string>>,
  traceId: string | undefined,
  key: string | undefined,
) => {
  if (!traceId || !key) return
  addToSetMap(traceIdToKeys, traceId, key)
  addToSetMap(keyToTraceIds, key, traceId)
}

const addSourcePortKey = (
  sourcePortSelectorToPortId: Map<string, string>,
  componentName: string | undefined,
  selector: unknown,
  sourcePortId: string,
) => {
  if (!componentName || selector === undefined || selector === null) return
  const normalizedSelector = normalizeSelector(String(selector))
  if (!normalizedSelector) return

  sourcePortSelectorToPortId.set(
    `${componentName}.${normalizedSelector}`,
    sourcePortId,
  )

  if (normalizedSelector.startsWith("pin")) {
    sourcePortSelectorToPortId.set(
      `${componentName}.${normalizedSelector.replace(/^pin/, "")}`,
      sourcePortId,
    )
  } else if (/^\d+$/.test(normalizedSelector)) {
    sourcePortSelectorToPortId.set(
      `${componentName}.pin${normalizedSelector}`,
      sourcePortId,
    )
  }
}

const getConnectedSourceTraceIds = (
  hoveredSourceTraceId: string,
  traceIdToKeys: Map<string, Set<string>>,
  keyToTraceIds: Map<string, Set<string>>,
) => {
  const connectedSourceTraceIds = new Set<string>()
  const queue = [hoveredSourceTraceId]

  while (queue.length > 0) {
    const sourceTraceId = queue.pop()
    if (!sourceTraceId || connectedSourceTraceIds.has(sourceTraceId)) continue

    connectedSourceTraceIds.add(sourceTraceId)

    for (const key of traceIdToKeys.get(sourceTraceId) ?? []) {
      for (const nextTraceId of keyToTraceIds.get(key) ?? []) {
        if (!connectedSourceTraceIds.has(nextTraceId)) {
          queue.push(nextTraceId)
        }
      }
    }
  }

  return connectedSourceTraceIds
}

export const getConnectedSchematicTraceIdsByHoveredTrace = (
  circuitJson: CircuitJson,
) => {
  const sourceTraceIdToSchematicTraceIds = new Map<string, Set<string>>()
  const schematicTraceIdToSourceTraceId = new Map<string, string>()
  const traceIdToKeys = new Map<string, Set<string>>()
  const keyToTraceIds = new Map<string, Set<string>>()
  const sourcePortSelectorToPortId = new Map<string, string>()
  const sourcePortIdToConnectivityKey = new Map<string, string>()

  const sourceComponentNameById = new Map<string, string>()

  for (const sourceComponent of getElementsByType(
    circuitJson,
    "source_component",
  )) {
    if (sourceComponent.source_component_id && sourceComponent.name) {
      sourceComponentNameById.set(
        sourceComponent.source_component_id,
        sourceComponent.name,
      )
    }
  }

  for (const sourcePort of getElementsByType(circuitJson, "source_port")) {
    const sourcePortId = sourcePort.source_port_id as string | undefined
    if (!sourcePortId) continue

    const sourceComponentName = sourceComponentNameById.get(
      sourcePort.source_component_id,
    )

    for (const selector of [
      sourcePort.name,
      sourcePort.pin_number,
      ...(sourcePort.port_hints ?? []),
    ]) {
      addSourcePortKey(
        sourcePortSelectorToPortId,
        sourceComponentName,
        selector,
        sourcePortId,
      )
    }

    if (sourcePort.subcircuit_connectivity_map_key) {
      sourcePortIdToConnectivityKey.set(
        sourcePortId,
        sourcePort.subcircuit_connectivity_map_key,
      )
    }
  }

  for (const sourceTrace of getElementsByType(circuitJson, "source_trace")) {
    const sourceTraceId = sourceTrace.source_trace_id as string | undefined
    if (!sourceTraceId) continue

    addTraceConnectivityKey(
      traceIdToKeys,
      keyToTraceIds,
      sourceTraceId,
      `source-trace:${sourceTraceId}`,
    )

    for (const sourceNetId of getStringArray(
      sourceTrace.connected_source_net_ids,
    )) {
      addTraceConnectivityKey(
        traceIdToKeys,
        keyToTraceIds,
        sourceTraceId,
        `source-net:${sourceNetId}`,
      )
    }

    if (sourceTrace.subcircuit_connectivity_map_key) {
      addTraceConnectivityKey(
        traceIdToKeys,
        keyToTraceIds,
        sourceTraceId,
        `connectivity:${sourceTrace.subcircuit_connectivity_map_key}`,
      )
    }

    for (const sourcePortId of getStringArray(
      sourceTrace.connected_source_port_ids,
    )) {
      addTraceConnectivityKey(
        traceIdToKeys,
        keyToTraceIds,
        sourceTraceId,
        `source-port:${sourcePortId}`,
      )
      const connectivityKey = sourcePortIdToConnectivityKey.get(sourcePortId)
      if (connectivityKey) {
        addTraceConnectivityKey(
          traceIdToKeys,
          keyToTraceIds,
          sourceTraceId,
          `connectivity:${connectivityKey}`,
        )
      }
    }
  }

  for (const schematicTrace of getElementsByType(
    circuitJson,
    "schematic_trace",
  )) {
    const schematicTraceId = schematicTrace.schematic_trace_id as
      | string
      | undefined
    const sourceTraceId = schematicTrace.source_trace_id as string | undefined
    if (!schematicTraceId || !sourceTraceId) continue

    schematicTraceIdToSourceTraceId.set(schematicTraceId, sourceTraceId)
    addToSetMap(
      sourceTraceIdToSchematicTraceIds,
      sourceTraceId,
      schematicTraceId,
    )

    addTraceConnectivityKey(
      traceIdToKeys,
      keyToTraceIds,
      sourceTraceId,
      `source-trace:${sourceTraceId}`,
    )

    if (schematicTrace.subcircuit_connectivity_map_key) {
      addTraceConnectivityKey(
        traceIdToKeys,
        keyToTraceIds,
        sourceTraceId,
        `connectivity:${schematicTrace.subcircuit_connectivity_map_key}`,
      )
    }

    for (const sourceNetId of getStringArray(
      schematicTrace.connected_source_net_ids,
    )) {
      addTraceConnectivityKey(
        traceIdToKeys,
        keyToTraceIds,
        sourceTraceId,
        `source-net:${sourceNetId}`,
      )
    }

    for (const sourcePortSelector of getSourcePortSelectorsFromSolverTraceId(
      sourceTraceId,
    )) {
      const sourcePortId =
        sourcePortSelectorToPortId.get(sourcePortSelector) ??
        (sourcePortIdToConnectivityKey.has(sourcePortSelector)
          ? sourcePortSelector
          : undefined)
      if (!sourcePortId) continue

      addTraceConnectivityKey(
        traceIdToKeys,
        keyToTraceIds,
        sourceTraceId,
        `source-port:${sourcePortId}`,
      )

      const connectivityKey = sourcePortIdToConnectivityKey.get(sourcePortId)
      if (connectivityKey) {
        addTraceConnectivityKey(
          traceIdToKeys,
          keyToTraceIds,
          sourceTraceId,
          `connectivity:${connectivityKey}`,
        )
      }
    }
  }

  const connectedSchematicTraceIdsByTraceId = new Map<string, Set<string>>()

  for (const [
    schematicTraceId,
    sourceTraceId,
  ] of schematicTraceIdToSourceTraceId) {
    const connectedSchematicTraceIds = new Set<string>()
    const connectedSourceTraceIds = getConnectedSourceTraceIds(
      sourceTraceId,
      traceIdToKeys,
      keyToTraceIds,
    )

    for (const connectedSourceTraceId of connectedSourceTraceIds) {
      for (const connectedSchematicTraceId of sourceTraceIdToSchematicTraceIds.get(
        connectedSourceTraceId,
      ) ?? []) {
        connectedSchematicTraceIds.add(connectedSchematicTraceId)
      }
    }

    if (connectedSchematicTraceIds.size === 0) {
      connectedSchematicTraceIds.add(schematicTraceId)
    }

    connectedSchematicTraceIdsByTraceId.set(
      schematicTraceId,
      connectedSchematicTraceIds,
    )
  }

  return connectedSchematicTraceIdsByTraceId
}
