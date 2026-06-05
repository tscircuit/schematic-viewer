import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect } from "react"

const HOVER_STYLE_ID = "schematic-trace-net-hover-style"
const HOVER_ATTR = "data-schematic-trace-net-hover"

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

    const schematicTraceIdToSourceTraceId = new Map<string, string>()
    const sourceTraceIdToSchematicTraceIds = new Map<string, Set<string>>()
    const sourceTraceIdToNetIds = new Map<string, Set<string>>()
    const netIdToSourceTraceIds = new Map<string, Set<string>>()
    const sourceTraceIdToPortIds = new Map<string, Set<string>>()
    const portIdToSourceTraceIds = new Map<string, Set<string>>()

    for (const sourceTrace of su(circuitJson).source_trace.list() as any[]) {
      const sourceTraceId = sourceTrace.source_trace_id as string | undefined
      if (!sourceTraceId) continue

      const netIds = new Set<string>(
        (sourceTrace.connected_source_net_ids ?? []).filter(Boolean),
      )
      sourceTraceIdToNetIds.set(sourceTraceId, netIds)

      for (const netId of netIds) {
        const sourceTraceIds = netIdToSourceTraceIds.get(netId) ?? new Set()
        sourceTraceIds.add(sourceTraceId)
        netIdToSourceTraceIds.set(netId, sourceTraceIds)
      }

      const portIds = new Set<string>(
        (sourceTrace.connected_source_port_ids ?? []).filter(Boolean),
      )
      sourceTraceIdToPortIds.set(sourceTraceId, portIds)

      for (const portId of portIds) {
        const sourceTraceIds = portIdToSourceTraceIds.get(portId) ?? new Set()
        sourceTraceIds.add(sourceTraceId)
        portIdToSourceTraceIds.set(portId, sourceTraceIds)
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
      const schematicTraceIds =
        sourceTraceIdToSchematicTraceIds.get(sourceTraceId) ?? new Set()
      schematicTraceIds.add(schematicTraceId)
      sourceTraceIdToSchematicTraceIds.set(sourceTraceId, schematicTraceIds)
    }

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

      const sourceTraceId =
        schematicTraceIdToSourceTraceId.get(schematicTraceId)
      if (!sourceTraceId) return

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
          for (const traceElement of Array.from(
            svg.querySelectorAll(
              `[data-circuit-json-type="schematic_trace"][data-schematic-trace-id="${connectedSchematicTraceId}"]`,
            ),
          )) {
            traceElement.setAttribute(HOVER_ATTR, "true")
          }
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
