import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect } from "react"

const TRACE_HOVER_CLASS = "schematic-trace-net-hover"

const getSourceTraceNetKey = (sourceTrace: any) => {
  if (!sourceTrace) return null

  if (sourceTrace.source_net_id)
    return `source_net:${sourceTrace.source_net_id}`
  if (sourceTrace.subcircuit_connectivity_map_key) {
    return `subcircuit:${sourceTrace.subcircuit_connectivity_map_key}`
  }
  if (sourceTrace.connected_source_port_ids?.length) {
    return `ports:${[...sourceTrace.connected_source_port_ids].sort().join("|")}`
  }

  return null
}

export const useHighlightConnectedSchematicTracesOnHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const soup = su(circuitJson)
    const sourceTraceToNetKey = new Map<string, string>()

    for (const sourceTrace of soup.source_trace.list() as any[]) {
      const sourceTraceId = sourceTrace.source_trace_id
      const netKey = getSourceTraceNetKey(sourceTrace)
      if (sourceTraceId && netKey) {
        sourceTraceToNetKey.set(sourceTraceId, netKey)
      }
    }

    const schematicTraceIdToNetKey = new Map<string, string>()
    for (const schematicTrace of soup.schematic_trace.list() as any[]) {
      const schematicTraceId = schematicTrace.schematic_trace_id
      const sourceTraceId = schematicTrace.source_trace_id
      const netKey = sourceTraceId
        ? sourceTraceToNetKey.get(sourceTraceId)
        : null

      if (schematicTraceId && netKey) {
        schematicTraceIdToNetKey.set(schematicTraceId, netKey)
      }
    }

    const traceGroups = Array.from(
      svgDiv.querySelectorAll<SVGGElement>(
        '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      ),
    )

    const getTraceNetKey = (traceGroup: SVGGElement) => {
      const traceId = traceGroup.getAttribute("data-schematic-trace-id")
      return traceId ? schematicTraceIdToNetKey.get(traceId) : null
    }

    const clearHover = () => {
      for (const traceGroup of traceGroups) {
        traceGroup.classList.remove(TRACE_HOVER_CLASS)
      }
    }

    const handlePointerEnter = (event: Event) => {
      const traceGroup = event.currentTarget as SVGGElement
      const hoveredNetKey = getTraceNetKey(traceGroup)
      if (!hoveredNetKey) return

      for (const candidateTraceGroup of traceGroups) {
        candidateTraceGroup.classList.toggle(
          TRACE_HOVER_CLASS,
          getTraceNetKey(candidateTraceGroup) === hoveredNetKey,
        )
      }
    }

    for (const traceGroup of traceGroups) {
      traceGroup.addEventListener("pointerenter", handlePointerEnter)
      traceGroup.addEventListener("pointerleave", clearHover)
    }

    return () => {
      for (const traceGroup of traceGroups) {
        traceGroup.removeEventListener("pointerenter", handlePointerEnter)
        traceGroup.removeEventListener("pointerleave", clearHover)
      }
    }
  }, [svgDivRef, circuitJson, circuitJsonKey])
}
