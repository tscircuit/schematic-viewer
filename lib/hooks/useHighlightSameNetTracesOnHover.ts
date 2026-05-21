import { useEffect, useMemo } from "react"
import type { CircuitJson } from "circuit-json"

const HOVER_TRACE_COLOR = "#60a5fa"

type CircuitElement = CircuitJson[number] & Record<string, any>

const getTraceNetKey = (
  sourceTrace: CircuitElement | undefined,
  sourceTraceId: string | undefined,
) => {
  if (!sourceTrace) return sourceTraceId

  if (sourceTrace.subcircuit_connectivity_map_key) {
    return `connectivity:${sourceTrace.subcircuit_connectivity_map_key}`
  }

  if (sourceTrace.connected_source_net_ids?.length) {
    return `nets:${[...sourceTrace.connected_source_net_ids].sort().join(",")}`
  }

  if (sourceTrace.connected_source_port_ids?.length) {
    return `ports:${[...sourceTrace.connected_source_port_ids].sort().join(",")}`
  }

  return sourceTraceId
}

const getVisibleTracePaths = (
  svg: HTMLDivElement,
  schematicTraceIds: Set<string>,
) => {
  const tracePaths: SVGPathElement[] = []

  for (const path of Array.from(
    svg.querySelectorAll<SVGPathElement>(
      '[data-circuit-json-type="schematic_trace"] path',
    ),
  )) {
    if (path.getAttribute("class")?.includes("invisible")) continue

    const traceGroup = path.closest("[data-schematic-trace-id]")
    const schematicTraceId = traceGroup?.getAttribute("data-schematic-trace-id")
    if (schematicTraceId && schematicTraceIds.has(schematicTraceId)) {
      tracePaths.push(path)
    }
  }

  return tracePaths
}

/**
 * Highlights every rendered schematic trace that belongs to the same source net
 * as the trace currently under the pointer.
 */
export const useHighlightSameNetTracesOnHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  const schematicTraceIdsByNetKey = useMemo(() => {
    const sourceTracesById = new Map<string, CircuitElement>()
    const traceIdsByNetKey = new Map<string, Set<string>>()

    for (const element of circuitJson as CircuitElement[]) {
      if (element.type === "source_trace") {
        sourceTracesById.set(element.source_trace_id, element)
      }
    }

    for (const element of circuitJson as CircuitElement[]) {
      if (element.type !== "schematic_trace") continue

      const sourceTraceId = element.source_trace_id as string | undefined
      const netKey = getTraceNetKey(
        sourceTraceId ? sourceTracesById.get(sourceTraceId) : undefined,
        sourceTraceId,
      )
      if (!netKey || !element.schematic_trace_id) continue

      if (!traceIdsByNetKey.has(netKey)) {
        traceIdsByNetKey.set(netKey, new Set())
      }
      traceIdsByNetKey.get(netKey)!.add(element.schematic_trace_id)
    }

    return traceIdsByNetKey
  }, [circuitJson, circuitJsonKey])

  const netKeyBySchematicTraceId = useMemo(() => {
    const netKeyByTraceId = new Map<string, string>()
    for (const [netKey, traceIds] of schematicTraceIdsByNetKey) {
      for (const traceId of traceIds) {
        netKeyByTraceId.set(traceId, netKey)
      }
    }
    return netKeyByTraceId
  }, [schematicTraceIdsByNetKey])

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const highlightedPaths = new Map<SVGPathElement, string | null>()

    const clearHighlight = () => {
      for (const [path, originalStroke] of highlightedPaths) {
        if (originalStroke === null) {
          path.removeAttribute("stroke")
        } else {
          path.setAttribute("stroke", originalStroke)
        }
      }
      highlightedPaths.clear()
    }

    const highlightTrace = (schematicTraceId: string) => {
      const netKey = netKeyBySchematicTraceId.get(schematicTraceId)
      const schematicTraceIds = netKey
        ? schematicTraceIdsByNetKey.get(netKey)
        : undefined
      if (!schematicTraceIds) return

      clearHighlight()

      for (const path of getVisibleTracePaths(svg, schematicTraceIds)) {
        highlightedPaths.set(path, path.getAttribute("stroke"))
        path.setAttribute("stroke", HOVER_TRACE_COLOR)
      }
    }

    const getTraceGroupFromTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null
      return target.closest("[data-schematic-trace-id]")
    }

    const handlePointerOver = (event: PointerEvent) => {
      const traceGroup = getTraceGroupFromTarget(event.target)
      const schematicTraceId = traceGroup?.getAttribute(
        "data-schematic-trace-id",
      )
      if (schematicTraceId) {
        highlightTrace(schematicTraceId)
      }
    }

    const handlePointerOut = (event: PointerEvent) => {
      const traceGroup = getTraceGroupFromTarget(event.target)
      const relatedTraceGroup = getTraceGroupFromTarget(event.relatedTarget)
      if (traceGroup && traceGroup === relatedTraceGroup) return
      clearHighlight()
    }

    svg.addEventListener("pointerover", handlePointerOver)
    svg.addEventListener("pointerout", handlePointerOut)
    svg.addEventListener("pointerleave", clearHighlight)

    return () => {
      clearHighlight()
      svg.removeEventListener("pointerover", handlePointerOver)
      svg.removeEventListener("pointerout", handlePointerOut)
      svg.removeEventListener("pointerleave", clearHighlight)
    }
  }, [svgDivRef, schematicTraceIdsByNetKey, netKeyBySchematicTraceId])
}
