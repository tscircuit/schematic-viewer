import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo, useRef } from "react"

const TRACE_HOVER_CLASS = "trace-hovered"

export const useHighlightConnectedTracesOnHover = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  const { sourceTraceToSchematicTraceIds, schematicTraceToSourceTraceId } =
    useMemo(() => {
      const sourceTraceToSchematicTraceIds = new Map<string, string[]>()
      const schematicTraceToSourceTraceId = new Map<string, string>()

      try {
        const schematicTraces = su(circuitJson).schematic_trace.list() ?? []
        for (const trace of schematicTraces) {
          if (!trace.schematic_trace_id || !trace.source_trace_id) continue
          const schematicTraceId = trace.schematic_trace_id as string
          const sourceTraceId = trace.source_trace_id as string

          schematicTraceToSourceTraceId.set(schematicTraceId, sourceTraceId)
          const existing = sourceTraceToSchematicTraceIds.get(sourceTraceId) ?? []
          existing.push(schematicTraceId)
          sourceTraceToSchematicTraceIds.set(sourceTraceId, existing)
        }
      } catch (err) {
        console.error("Failed to map schematic traces", err)
      }

      return { sourceTraceToSchematicTraceIds, schematicTraceToSourceTraceId }
    }, [circuitJson])

  const activeSourceTraceIdRef = useRef<string | null>(null)
  const highlightedTraceIdsRef = useRef<string[]>([])

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const clearHighlight = () => {
      if (!svgDivRef.current) return
      for (const traceId of highlightedTraceIdsRef.current) {
        const traceElements = svgDivRef.current.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"]`,
        )
        for (const traceElement of Array.from(traceElements)) {
          traceElement.classList.remove(TRACE_HOVER_CLASS)
        }
      }
      highlightedTraceIdsRef.current = []
      activeSourceTraceIdRef.current = null
    }

    const applyHighlight = (sourceTraceId: string) => {
      if (!svgDivRef.current) return
      const traceIds = sourceTraceToSchematicTraceIds.get(sourceTraceId) ?? []
      if (traceIds.length === 0) {
        clearHighlight()
        return
      }

      highlightedTraceIdsRef.current = traceIds
      activeSourceTraceIdRef.current = sourceTraceId

      for (const traceId of traceIds) {
        const traceElements = svgDivRef.current.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"]`,
        )
        for (const traceElement of Array.from(traceElements)) {
          traceElement.classList.add(TRACE_HOVER_CLASS)
        }
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (!target) {
        clearHighlight()
        return
      }

      const traceGroup = target.closest(
        '[data-circuit-json-type="schematic_trace"]',
      )
      if (!traceGroup) {
        clearHighlight()
        return
      }

      const schematicTraceId = traceGroup.getAttribute(
        "data-schematic-trace-id",
      )
      if (!schematicTraceId) {
        clearHighlight()
        return
      }

      const sourceTraceId =
        schematicTraceToSourceTraceId.get(schematicTraceId) ?? null
      if (!sourceTraceId) {
        clearHighlight()
        return
      }

      if (sourceTraceId === activeSourceTraceIdRef.current) return

      clearHighlight()
      applyHighlight(sourceTraceId)
    }

    const handlePointerLeave = () => {
      clearHighlight()
    }

    svgDiv.addEventListener("pointermove", handlePointerMove)
    svgDiv.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      svgDiv.removeEventListener("pointermove", handlePointerMove)
      svgDiv.removeEventListener("pointerleave", handlePointerLeave)
      clearHighlight()
    }
  }, [svgDivRef, sourceTraceToSchematicTraceIds, schematicTraceToSourceTraceId])
}
