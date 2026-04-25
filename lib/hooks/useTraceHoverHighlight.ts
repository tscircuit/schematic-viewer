import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect } from "react"

const STYLE_ID = "trace-hover-highlight-style"
const HIGHLIGHT_COLOR = "#1a86d9"

/**
 * Highlights all schematic traces that share the same net when hovering over
 * any trace in the schematic viewer. Fixes tscircuit/tscircuit#1130.
 *
 * Detection strategy (in order of preference):
 * 1. subcircuit_connectivity_map_key — traces with the same key are on the same net
 * 2. source_trace_id — traces sharing the same source trace belong together
 */
export const useTraceHoverHighlight = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  useEffect(() => {
    const container = svgDivRef.current
    if (!container) return

    // Build lookup: schematicTraceId -> set of related schematicTraceIds
    const netGroupMap = new Map<string, Set<string>>()

    const schematicTraces = su(circuitJson).schematic_trace.list()

    // Group by subcircuit_connectivity_map_key (preferred)
    const byConnectivityKey = new Map<string, string[]>()
    for (const st of schematicTraces) {
      if (st.subcircuit_connectivity_map_key) {
        const key = st.subcircuit_connectivity_map_key
        if (!byConnectivityKey.has(key)) {
          byConnectivityKey.set(key, [])
        }
        byConnectivityKey.get(key)!.push(st.schematic_trace_id)
      }
    }

    for (const group of byConnectivityKey.values()) {
      const groupSet = new Set(group)
      for (const id of group) {
        netGroupMap.set(id, groupSet)
      }
    }

    // For traces not yet grouped, fall back to source_trace_id grouping
    const bySourceTraceId = new Map<string, string[]>()
    for (const st of schematicTraces) {
      if (!netGroupMap.has(st.schematic_trace_id) && st.source_trace_id) {
        if (!bySourceTraceId.has(st.source_trace_id)) {
          bySourceTraceId.set(st.source_trace_id, [])
        }
        bySourceTraceId.get(st.source_trace_id)!.push(st.schematic_trace_id)
      }
    }

    for (const group of bySourceTraceId.values()) {
      const groupSet = new Set(group)
      for (const id of group) {
        netGroupMap.set(id, groupSet)
      }
    }

    const ensureStyle = () => {
      if (container.querySelector(`#${STYLE_ID}`)) return
      const style = document.createElement("style")
      style.id = STYLE_ID
      style.textContent = `
        [data-trace-hover-highlighted="true"] path:not(.trace-invisible-hover-outline):not(.trace-crossing-outline) {
          stroke: ${HIGHLIGHT_COLOR} !important;
        }
      `
      container.appendChild(style)
    }

    const clearHighlights = () => {
      for (const el of Array.from(
        container.querySelectorAll("[data-trace-hover-highlighted]"),
      )) {
        el.removeAttribute("data-trace-hover-highlighted")
      }
    }

    const handleMouseOver = (event: MouseEvent) => {
      const traceGroup = (event.target as Element).closest(
        "[data-schematic-trace-id]",
      )
      if (!traceGroup) return

      const hoveredId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!hoveredId) return

      ensureStyle()
      clearHighlights()

      const relatedIds = netGroupMap.get(hoveredId) ?? new Set([hoveredId])
      for (const id of relatedIds) {
        for (const el of Array.from(
          container.querySelectorAll(`[data-schematic-trace-id="${id}"]`),
        )) {
          el.setAttribute("data-trace-hover-highlighted", "true")
        }
      }
    }

    const handleMouseLeave = (event: MouseEvent) => {
      // Only clear when leaving the container entirely
      const related = event.relatedTarget as Element | null
      if (related && container.contains(related)) return
      clearHighlights()
    }

    container.addEventListener("mouseover", handleMouseOver)
    container.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      container.removeEventListener("mouseover", handleMouseOver)
      container.removeEventListener("mouseleave", handleMouseLeave)
      container.querySelector(`#${STYLE_ID}`)?.remove()
      clearHighlights()
    }
  }, [svgDivRef, circuitJson])
}
