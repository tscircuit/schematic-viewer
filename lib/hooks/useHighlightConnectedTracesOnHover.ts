import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect } from "react"

const HOVER_STYLE_ID = "schematic-trace-net-hover-style"
const HOVER_ATTR = "data-schematic-trace-net-hover"

const addToSetMap = (
  map: Map<string, Set<string>>,
  key: string,
  value: string,
) => {
  const values = map.get(key) ?? new Set()
  values.add(value)
  map.set(key, values)
}

const getSolverSourcePortSelectors = (sourceTraceId: string) => {
  if (!sourceTraceId.startsWith("solver_")) return []

  return sourceTraceId
    .replace(/^solver_/, "")
    .split("-")
    .filter(Boolean)
}

const getConnectedSourceTraceIds = (
  hoveredSourceTraceId: string,
  sourceTraceIdToNetIds: Map<string, Set<string>>,
  netIdToSourceTraceIds: Map<string, Set<string>>,
  sourceTraceIdToPortIds: Map<string, Set<string>>,
  portIdToSourceTraceIds: Map<string, Set<string>>,
) => {
  const connectedSourceTraceIds = new Set<string>()
  const queue = [hoveredSourceTraceId]

  while (queue.length > 0) {
    const sourceTraceId = queue.pop()
    if (!sourceTraceId || connectedSourceTraceIds.has(sourceTraceId)) continue

    connectedSourceTraceIds.add(sourceTraceId)

    for (const netId of sourceTraceIdToNetIds.get(sourceTraceId) ?? []) {
      for (const nextTraceId of netIdToSourceTraceIds.get(netId) ?? []) {
        if (!connectedSourceTraceIds.has(nextTraceId)) {
          queue.push(nextTraceId)
        }
      }
    }

    for (const portId of sourceTraceIdToPortIds.get(sourceTraceId) ?? []) {
      for (const nextTraceId of portIdToSourceTraceIds.get(portId) ?? []) {
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
  const schematicTraceIdToSourceTraceId = new Map<string, string>()
  const sourceTraceIdToSchematicTraceIds = new Map<string, Set<string>>()
  const sourceTraceIdToNetIds = new Map<string, Set<string>>()
  const netIdToSourceTraceIds = new Map<string, Set<string>>()
  const sourceTraceIdToPortIds = new Map<string, Set<string>>()
  const portIdToSourceTraceIds = new Map<string, Set<string>>()
  const sourcePortSelectorToPortId = new Map<string, string>()
  const sourcePortIdToConnectivityKey = new Map<string, string>()

  for (const sourceComponent of su(
    circuitJson,
  ).source_component.list() as any[]) {
    const sourceComponentId = sourceComponent.source_component_id as
      | string
      | undefined
    const componentName = sourceComponent.name as string | undefined
    if (!sourceComponentId || !componentName) continue

    for (const sourcePort of su(circuitJson).source_port.list({
      source_component_id: sourceComponentId,
    }) as any[]) {
      const sourcePortId = sourcePort.source_port_id as string | undefined
      if (!sourcePortId) continue

      const portSelectors = [
        sourcePort.name,
        sourcePort.pin_number,
        ...(sourcePort.port_hints ?? []),
      ]
        .filter(Boolean)
        .map(String)

      for (const portSelector of portSelectors) {
        sourcePortSelectorToPortId.set(
          `${componentName}.${portSelector}`,
          sourcePortId,
        )
      }

      const connectivityKey = sourcePort.subcircuit_connectivity_map_key as
        | string
        | undefined
      if (connectivityKey) {
        sourcePortIdToConnectivityKey.set(sourcePortId, connectivityKey)
      }
    }
  }

  for (const sourceTrace of su(circuitJson).source_trace.list() as any[]) {
    const sourceTraceId = sourceTrace.source_trace_id as string | undefined
    if (!sourceTraceId) continue

    const netIds = new Set<string>(
      (sourceTrace.connected_source_net_ids ?? []).filter(Boolean),
    )
    if (sourceTrace.subcircuit_connectivity_map_key) {
      netIds.add(`connectivity:${sourceTrace.subcircuit_connectivity_map_key}`)
    }
    sourceTraceIdToNetIds.set(sourceTraceId, netIds)

    for (const netId of netIds) {
      addToSetMap(netIdToSourceTraceIds, netId, sourceTraceId)
    }

    const portIds = new Set<string>(
      (sourceTrace.connected_source_port_ids ?? []).filter(Boolean),
    )
    sourceTraceIdToPortIds.set(sourceTraceId, portIds)

    for (const portId of portIds) {
      addToSetMap(portIdToSourceTraceIds, portId, sourceTraceId)
    }
  }

  for (const schematicTrace of su(
    circuitJson,
  ).schematic_trace.list() as any[]) {
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

    const solverPortIds = getSolverSourcePortSelectors(sourceTraceId)
      .map((portSelector) => sourcePortSelectorToPortId.get(portSelector))
      .filter(Boolean) as string[]

    if (solverPortIds.length > 0) {
      const netIds = sourceTraceIdToNetIds.get(sourceTraceId) ?? new Set()
      const portIds = sourceTraceIdToPortIds.get(sourceTraceId) ?? new Set()

      for (const sourcePortId of solverPortIds) {
        portIds.add(sourcePortId)

        const connectivityKey = sourcePortIdToConnectivityKey.get(sourcePortId)
        if (connectivityKey) {
          netIds.add(`connectivity:${connectivityKey}`)
        }
      }

      sourceTraceIdToPortIds.set(sourceTraceId, portIds)
      sourceTraceIdToNetIds.set(sourceTraceId, netIds)

      for (const sourcePortId of portIds) {
        addToSetMap(portIdToSourceTraceIds, sourcePortId, sourceTraceId)
      }

      for (const netId of netIds) {
        addToSetMap(netIdToSourceTraceIds, netId, sourceTraceId)
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
      sourceTraceIdToNetIds,
      netIdToSourceTraceIds,
      sourceTraceIdToPortIds,
      portIdToSourceTraceIds,
    )

    for (const connectedSourceTraceId of connectedSourceTraceIds) {
      for (const connectedSchematicTraceId of sourceTraceIdToSchematicTraceIds.get(
        connectedSourceTraceId,
      ) ?? []) {
        connectedSchematicTraceIds.add(connectedSchematicTraceId)
      }
    }

    connectedSchematicTraceIdsByTraceId.set(
      schematicTraceId,
      connectedSchematicTraceIds,
    )
  }

  return connectedSchematicTraceIdsByTraceId
}

export const useHighlightConnectedTracesOnHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const connectedSchematicTraceIdsByTraceId =
      getConnectedSchematicTraceIdsByHoveredTrace(circuitJson)

    const ensureHoverStyle = () => {
      if (!svg.querySelector(`style#${HOVER_STYLE_ID}`)) {
        const style = document.createElement("style")
        style.id = HOVER_STYLE_ID
        style.textContent = `
          [data-circuit-json-type="schematic_trace"][${HOVER_ATTR}="true"] {
            filter: invert(1);
          }

          [data-circuit-json-type="schematic_trace"][${HOVER_ATTR}="true"] .trace-crossing-outline {
            opacity: 0;
          }
        `
        svg.appendChild(style)
      }
    }

    const clearHighlightedTraces = () => {
      for (const trace of Array.from(svg.querySelectorAll(`[${HOVER_ATTR}]`))) {
        trace.removeAttribute(HOVER_ATTR)
      }
    }

    const highlightConnectedTraces = (schematicTraceId: string) => {
      clearHighlightedTraces()

      for (const connectedSchematicTraceId of connectedSchematicTraceIdsByTraceId.get(
        schematicTraceId,
      ) ?? []) {
        for (const traceElement of Array.from(
          svg.querySelectorAll(
            `[data-circuit-json-type="schematic_trace"][data-schematic-trace-id="${connectedSchematicTraceId}"]`,
          ),
        )) {
          traceElement.setAttribute(HOVER_ATTR, "true")
        }
      }
    }

    const cleanupListeners: Array<() => void> = []

    const attachTraceHoverListeners = () => {
      ensureHoverStyle()
      cleanupListeners.splice(0).forEach((cleanup) => cleanup())

      const traceElements = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      )

      for (const traceElement of Array.from(traceElements)) {
        const schematicTraceId = traceElement.getAttribute(
          "data-schematic-trace-id",
        )
        if (!schematicTraceId) continue

        const handlePointerEnter = () => {
          highlightConnectedTraces(schematicTraceId)
        }

        traceElement.addEventListener("pointerenter", handlePointerEnter)
        traceElement.addEventListener("pointerleave", clearHighlightedTraces)

        cleanupListeners.push(() => {
          traceElement.removeEventListener("pointerenter", handlePointerEnter)
          traceElement.removeEventListener(
            "pointerleave",
            clearHighlightedTraces,
          )
        })
      }
    }

    attachTraceHoverListeners()

    const observer = new MutationObserver(attachTraceHoverListeners)
    observer.observe(svg, {
      childList: true,
      subtree: false,
    })

    return () => {
      observer.disconnect()
      cleanupListeners.splice(0).forEach((cleanup) => cleanup())
      clearHighlightedTraces()
    }
  }, [svgDivRef, circuitJson, circuitJsonKey])
}
