import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

const HOVER_CLASS = "same-net-trace-hover"

export const useHighlightConnectedTracesOnHover = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    let hoveredTraceGroupKey: string | null = null
    const traceGroupKeyBySchematicTraceId = new Map<string, string>()

    try {
      const sourceTraceById = new Map<string, any>()
      for (const trace of su(circuitJson).source_trace.list()) {
        sourceTraceById.set(trace.source_trace_id, trace)
      }

      for (const trace of su(circuitJson).schematic_trace.list()) {
        if (!trace.schematic_trace_id || !trace.source_trace_id) continue
        const sourceTrace = sourceTraceById.get(trace.source_trace_id)
        const sourceNetIds = [...(sourceTrace?.connected_source_net_ids ?? [])]
          .filter(Boolean)
          .sort()
        const traceGroupKey =
          sourceNetIds.length > 0
            ? `source_net:${sourceNetIds.join("|")}`
            : `source_trace:${trace.source_trace_id}`

        traceGroupKeyBySchematicTraceId.set(
          trace.schematic_trace_id,
          traceGroupKey,
        )
      }
    } catch (err) {
      console.error("Failed to derive schematic trace ids", err)
      return
    }

    const traceGroups = () =>
      svg.querySelectorAll<SVGElement>(
        '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      )

    const clearHoverClasses = () => {
      for (const traceGroup of Array.from(traceGroups())) {
        traceGroup.classList.remove(HOVER_CLASS)
      }
    }

    const setHoveredTraceGroupKey = (traceGroupKey: string | null) => {
      if (traceGroupKey === hoveredTraceGroupKey) return
      hoveredTraceGroupKey = traceGroupKey
      clearHoverClasses()

      if (!traceGroupKey) return

      for (const traceGroup of Array.from(traceGroups())) {
        const schematicTraceId = traceGroup.getAttribute(
          "data-schematic-trace-id",
        )
        if (
          schematicTraceId &&
          traceGroupKeyBySchematicTraceId.get(schematicTraceId) ===
            traceGroupKey
        ) {
          traceGroup.classList.add(HOVER_CLASS)
        }
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) {
        setHoveredTraceGroupKey(null)
        return
      }

      const traceGroup = target.closest<SVGElement>(
        '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      )
      const schematicTraceId = traceGroup?.getAttribute(
        "data-schematic-trace-id",
      )
      const traceGroupKey = schematicTraceId
        ? (traceGroupKeyBySchematicTraceId.get(schematicTraceId) ?? null)
        : null

      setHoveredTraceGroupKey(traceGroupKey)
    }

    const handlePointerLeave = () => setHoveredTraceGroupKey(null)

    svg.addEventListener("pointermove", handlePointerMove)
    svg.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      svg.removeEventListener("pointermove", handlePointerMove)
      svg.removeEventListener("pointerleave", handlePointerLeave)
      clearHoverClasses()
    }
  }, [svgDivRef, circuitJson])
}
