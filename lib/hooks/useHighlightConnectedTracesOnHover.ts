import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

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

    let currentHoveredTraceId: string | null = null

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element
      const traceElement = target.closest(
        '[data-circuit-json-type="schematic_trace"]',
      )
      if (!traceElement) {
        if (currentHoveredTraceId) {
          clearHover()
        }
        return
      }

      const schematicTraceId = traceElement.getAttribute(
        "data-schematic-trace-id",
      )
      if (!schematicTraceId || schematicTraceId === currentHoveredTraceId)
        return

      clearHover()
      currentHoveredTraceId = schematicTraceId
      highlightTraces(schematicTraceId)
    }

    const handleMouseOut = (e: MouseEvent) => {
      // If the mouse is leaving the svg entirely
      const relatedTarget = e.relatedTarget as Element
      if (!svg.contains(relatedTarget)) {
        clearHover()
      }
    }

    const clearHover = () => {
      currentHoveredTraceId = null
      const allTraces = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"] path',
      )
      for (const trace of Array.from(allTraces)) {
        trace.removeAttribute("data-is-hovered")
        ;(trace as SVGPathElement).style.stroke = ""
      }
    }

    const highlightTraces = (schematicTraceId: string) => {
      const schematicTrace =
        su(circuitJson).schematic_trace.get(schematicTraceId)
      if (!schematicTrace) return

      const sourceTraceId = schematicTrace.source_trace_id
      const sourceTrace = sourceTraceId
        ? su(circuitJson).source_trace.get(sourceTraceId)
        : null
      const sourceNetId = sourceTrace?.source_net_id

      let tracesToHighlight: any[] = []

      if (sourceNetId) {
        const sourceTracesOnNet = su(circuitJson).source_trace.list({
          source_net_id: sourceNetId,
        })
        const sourceTraceIdsOnNet = new Set(
          sourceTracesOnNet.map((t) => t.source_trace_id),
        )
        tracesToHighlight = su(circuitJson)
          .schematic_trace.list()
          .filter(
            (t) =>
              t.source_trace_id && sourceTraceIdsOnNet.has(t.source_trace_id),
          )
      } else if (sourceTraceId) {
        // Fallback: group by source_trace_id if net is missing
        tracesToHighlight = su(circuitJson)
          .schematic_trace.list()
          .filter((t) => t.source_trace_id === sourceTraceId)
      } else {
        tracesToHighlight = [schematicTrace]
      }

      tracesToHighlight.forEach((trace) => {
        const traceElements = svg.querySelectorAll(
          `[data-schematic-trace-id="${trace.schematic_trace_id}"] path`,
        )
        for (const traceElement of Array.from(traceElements)) {
          traceElement.setAttribute("data-is-hovered", "true")
          // Set a blue hover color, like components
          ;(traceElement as SVGPathElement).style.stroke =
            "var(--tscircuit-trace-hover-color, #3b82f6)"
        }
      })
    }

    svg.addEventListener("mouseover", handleMouseOver)
    svg.addEventListener("mouseout", handleMouseOut)

    return () => {
      svg.removeEventListener("mouseover", handleMouseOver)
      svg.removeEventListener("mouseout", handleMouseOut)
      clearHover()
    }
  }, [svgDivRef, circuitJson])
}
