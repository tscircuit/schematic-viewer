import { useEffect } from "react"
import type { CircuitJson } from "circuit-json"

const HIGHLIGHT_COLOR = "#60a5fa"

/**
 * This hook highlights traces on hover and all traces connected to the same net.
 * Net grouping is derived from the SVG's data-subcircuit-connectivity-map-key attribute.
 */
export const useTraceHoverHighlight = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    // Hover state
    const originalStrokes = new Map<Element, string>()
    let currentNetKey: string | null = null

    const clearHighlights = () => {
      for (const [el, stroke] of originalStrokes) {
        el.setAttribute("stroke", stroke)
      }
      originalStrokes.clear()
      currentNetKey = null
    }

    const applyHighlights = (netKey: string) => {
      // Find all trace groups on the same net
      const sameNetTraces = svg.querySelectorAll(
        `[data-subcircuit-connectivity-map-key="${netKey}"][data-circuit-json-type="schematic_trace"]`,
      )
      for (const traceGroup of Array.from(sameNetTraces)) {
        const paths = traceGroup.querySelectorAll("path")
        for (const path of Array.from(paths)) {
          if (path.getAttribute("class")?.includes("invisible")) continue
          originalStrokes.set(path, path.getAttribute("stroke") || "")
          path.setAttribute("stroke", HIGHLIGHT_COLOR)
        }
      }
      currentNetKey = netKey
    }

    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as Element
      if (!target?.closest) return

      const traceGroup = target.closest(
        "[data-circuit-json-type='schematic_trace']",
      )
      if (!traceGroup) {
        if (currentNetKey !== null) clearHighlights()
        return
      }

      const netKey = traceGroup.getAttribute(
        "data-subcircuit-connectivity-map-key",
      )
      if (!netKey) {
        // No net key — highlight just this single trace
        const traceId = traceGroup.getAttribute("data-schematic-trace-id")
        if (!traceId || currentNetKey === `single:${traceId}`) return
        clearHighlights()
        const paths = traceGroup.querySelectorAll("path")
        for (const path of Array.from(paths)) {
          if (path.getAttribute("class")?.includes("invisible")) continue
          originalStrokes.set(path, path.getAttribute("stroke") || "")
          path.setAttribute("stroke", HIGHLIGHT_COLOR)
        }
        currentNetKey = `single:${traceId}`
        return
      }

      // Already highlighting this net
      if (netKey === currentNetKey) return

      clearHighlights()
      applyHighlights(netKey)
    }

    const handlePointerLeave = () => {
      clearHighlights()
    }

    svg.addEventListener("pointermove", handlePointerMove)
    svg.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      clearHighlights()
      svg.removeEventListener("pointermove", handlePointerMove)
      svg.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [svgDivRef, circuitJson])
}
