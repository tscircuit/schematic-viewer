import { useEffect, useRef, useCallback } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

/**
 * This hook highlights all traces in the same electrical net when any trace is hovered.
 * An electrical "net" is a group of traces that share the same source_trace_id.
 */
export const useTraceHoverHighlighting = ({
  svgDivRef,
  circuitJson,
  enabled = true,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  enabled?: boolean
}) => {
  const hoveredTraceIdRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const highlightTraces = useCallback(
    (schematicTraceIds: string[], highlight: boolean) => {
      const svg = svgDivRef.current
      if (!svg) return

      for (const traceId of schematicTraceIds) {
        const traceElements = svg.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"] path`
        )
        for (const el of Array.from(traceElements)) {
          if (el.getAttribute("class")?.includes("invisible")) continue

          if (highlight) {
            ;(el as HTMLElement).style.stroke = "#ff6b00"
            ;(el as HTMLElement).style.strokeWidth = "8"
            ;(el as HTMLElement).style.filter =
              "drop-shadow(0 0 4px rgba(255, 107, 0, 0.6))"
          } else {
            ;(el as HTMLElement).style.stroke = ""
            ;(el as HTMLElement).style.strokeWidth = ""
            ;(el as HTMLElement).style.filter = ""
          }
        }
      }
    },
    [svgDivRef]
  )

  const getRelatedTraceIds = useCallback(
    (schematicTraceId: string): string[] => {
      try {
        // Find the schematic trace
        const schematicTrace = su(circuitJson).schematic_trace.get(schematicTraceId)
        if (!schematicTrace) return [schematicTraceId]

        const sourceTraceId = schematicTrace.source_trace_id
        if (!sourceTraceId) return [schematicTraceId]

        // Get the source trace to find its connected net IDs
        const sourceTrace = su(circuitJson).source_trace.get(sourceTraceId)
        if (!sourceTrace) {
          // Fallback: just find traces with same source_trace_id
          const relatedTraces = su(circuitJson)
            .schematic_trace.list()
            .filter((st) => st.source_trace_id === sourceTraceId)
          return relatedTraces.map((t) => t.schematic_trace_id)
        }

        // Get net IDs this trace is connected to
        const connectedNetIds = new Set(sourceTrace.connected_source_net_ids || [])

        if (connectedNetIds.size === 0) {
          // No nets, just use source_trace_id grouping
          const relatedTraces = su(circuitJson)
            .schematic_trace.list()
            .filter((st) => st.source_trace_id === sourceTraceId)
          return relatedTraces.map((t) => t.schematic_trace_id)
        }

        // Find ALL source traces that share any of these net IDs
        const allSourceTraces = su(circuitJson).source_trace.list()
        const relatedSourceTraceIds = new Set<string>()

        for (const st of allSourceTraces) {
          const stNetIds = st.connected_source_net_ids || []
          // Check if this trace shares any net with the hovered trace
          if (stNetIds.some((netId: string) => connectedNetIds.has(netId))) {
            relatedSourceTraceIds.add(st.source_trace_id)
          }
        }

        // Find all schematic traces for these source traces
        const relatedSchematicTraces = su(circuitJson)
          .schematic_trace.list()
          .filter((st) => st.source_trace_id && relatedSourceTraceIds.has(st.source_trace_id))

        return relatedSchematicTraces.map((t) => t.schematic_trace_id)
      } catch {
        return [schematicTraceId]
      }
    },
    [circuitJson]
  )

  useEffect(() => {
    if (!enabled) return

    const svg = svgDivRef.current
    if (!svg) return

    const handleMouseEnter = (e: Event) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const target = e.target as HTMLElement
      const traceGroup = target.closest("[data-schematic-trace-id]")
      if (!traceGroup) return

      const schematicTraceId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!schematicTraceId) return

      // If already hovering this trace, do nothing
      if (hoveredTraceIdRef.current === schematicTraceId) return

      // Clear previous highlight
      if (hoveredTraceIdRef.current) {
        const prevRelatedIds = getRelatedTraceIds(hoveredTraceIdRef.current)
        highlightTraces(prevRelatedIds, false)
      }

      // Set new hover state and highlight
      hoveredTraceIdRef.current = schematicTraceId
      const relatedTraceIds = getRelatedTraceIds(schematicTraceId)
      highlightTraces(relatedTraceIds, true)
    }

    const handleMouseLeave = (e: Event) => {
      const target = e.target as HTMLElement
      const traceGroup = target.closest("[data-schematic-trace-id]")
      if (!traceGroup) return

      const schematicTraceId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!schematicTraceId) return

      // Add small delay to prevent flickering when moving between connected traces
      timeoutRef.current = setTimeout(() => {
        if (hoveredTraceIdRef.current) {
          const relatedTraceIds = getRelatedTraceIds(hoveredTraceIdRef.current)
          highlightTraces(relatedTraceIds, false)
          hoveredTraceIdRef.current = null
        }
      }, 50)
    }

    const attachListeners = () => {
      const tracePaths = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"] path'
      )
      for (const path of Array.from(tracePaths)) {
        path.addEventListener("mouseenter", handleMouseEnter)
        path.addEventListener("mouseleave", handleMouseLeave)
      }
    }

    const detachListeners = () => {
      const tracePaths = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"] path'
      )
      for (const path of Array.from(tracePaths)) {
        path.removeEventListener("mouseenter", handleMouseEnter)
        path.removeEventListener("mouseleave", handleMouseLeave)
      }
    }

    // Attach listeners initially
    attachListeners()

    // Re-attach on DOM changes (SVG re-render)
    const observer = new MutationObserver(() => {
      detachListeners()
      attachListeners()
    })
    observer.observe(svg, { childList: true, subtree: false })

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      detachListeners()
      observer.disconnect()
    }
  }, [svgDivRef, circuitJson, enabled, highlightTraces, getRelatedTraceIds])
}
