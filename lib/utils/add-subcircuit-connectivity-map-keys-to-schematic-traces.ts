import type { CircuitJson } from "circuit-json"

const normalizePinToken = (token: string | number | undefined | null) => {
  if (token === undefined || token === null) return ""
  return String(token).replace(/^pin/i, "")
}

export const addSubcircuitConnectivityMapKeysToSchematicTraces = (
  circuitJson: CircuitJson,
): CircuitJson => {
  const componentNameById = new Map<string, string>()
  const sourceTraceKeyById = new Map<string, string>()
  const portKeyByComponentAndPin = new Map<string, string>()

  for (const elm of circuitJson as any[]) {
    if (elm.type === "source_component" && elm.source_component_id) {
      componentNameById.set(elm.source_component_id, elm.name)
    }
  }

  for (const elm of circuitJson as any[]) {
    if (
      elm.type === "source_trace" &&
      elm.source_trace_id &&
      elm.subcircuit_connectivity_map_key
    ) {
      sourceTraceKeyById.set(
        elm.source_trace_id,
        elm.subcircuit_connectivity_map_key,
      )
    }

    if (
      elm.type === "source_port" &&
      elm.source_component_id &&
      elm.subcircuit_connectivity_map_key
    ) {
      const componentName = componentNameById.get(elm.source_component_id)
      if (!componentName) continue

      const pinTokens = new Set<string>()
      pinTokens.add(normalizePinToken(elm.pin_number))
      pinTokens.add(normalizePinToken(elm.name))
      for (const hint of elm.port_hints ?? []) {
        pinTokens.add(normalizePinToken(hint))
      }

      for (const pinToken of pinTokens) {
        if (!pinToken) continue
        portKeyByComponentAndPin.set(
          `${componentName}.${pinToken}`,
          elm.subcircuit_connectivity_map_key,
        )
      }
    }
  }

  const getKeyForSchematicTrace = (schematicTrace: any) => {
    if (schematicTrace.subcircuit_connectivity_map_key) {
      return schematicTrace.subcircuit_connectivity_map_key
    }

    const directSourceTraceKey = sourceTraceKeyById.get(
      schematicTrace.source_trace_id,
    )
    if (directSourceTraceKey) return directSourceTraceKey

    const solverMatch =
      schematicTrace.source_trace_id?.match(/^solver_(.+?)-(.+)$/)
    if (!solverMatch) return undefined

    for (const endpoint of [solverMatch[1], solverMatch[2]]) {
      const endpointMatch = endpoint.match(/^(.+)\.([^.\s]+)$/)
      if (!endpointMatch) continue
      const key = portKeyByComponentAndPin.get(
        `${endpointMatch[1]}.${normalizePinToken(endpointMatch[2])}`,
      )
      if (key) return key
    }

    return undefined
  }

  return (circuitJson as any[]).map((elm) => {
    if (elm.type !== "schematic_trace") return elm
    const subcircuitConnectivityMapKey = getKeyForSchematicTrace(elm)
    if (!subcircuitConnectivityMapKey) return elm
    return {
      ...elm,
      subcircuit_connectivity_map_key: subcircuitConnectivityMapKey,
    }
  }) as CircuitJson
}
