import { useEffect, useRef, useCallback } from "react"
import type { CircuitJson } from "circuit-json"

/**
 * Hook to add hover color change for schematic traces.
 * When hovering over a trace, all traces with the same source_trace_id (same net) are highlighted.
 */
export const useSchematicTraceHover = ({
  svgDivRef,
  circuitJson,
  enabled = true,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  enabled?: boolean
}) => {
  const hoveredTraceIdRef = useRef<string | null>(null)

  const handleTraceMouseEnter = useCallback(
    (e: Event) => {
      if (!enabled) return
      const target = e.currentTarget as SVGElement
      const traceId = target.getAttribute("data-schematic-trace-id")
      if (!traceId) return

      hoveredTraceIdRef.current = traceId
      const svg = svgDivRef.current
      if (!svg) return

      // Find all paths in the same trace group and add hover class
      const tracePaths = svg.querySelectorAll(
        `[data-schematic-trace-id="${traceId}"] path`,
      )

      for (const path of Array.from(tracePaths)) {
        const pathEl = path as SVGPathElement
        // Store original stroke color
        if (!pathEl.dataset.originalStroke) {
          pathEl.dataset.originalStroke = pathEl.getAttribute("stroke") || ""
        }
        // Apply hover color - use a bright blue for visibility
        pathEl.setAttribute("stroke", "#3b82f6")
        pathEl.setAttribute("stroke-width", "3")
        pathEl.style.filter = "drop-shadow(0 0 3px rgba(59, 130, 246, 0.5))"
      }
    },
    [enabled, svgDivRef],
  )

  const handleTraceMouseLeave = useCallback(
    (e: Event) => {
      if (!enabled) return
      const target = e.currentTarget as SVGElement
      const traceId = target.getAttribute("data-schematic-trace-id")
      if (!traceId) return

      hoveredTraceIdRef.current = null
      const svg = svgDivRef.current
      if (!svg) return

      // Restore original styles
      const tracePaths = svg.querySelectorAll(
        `[data-schematic-trace-id="${traceId}"] path`,
      )

      for (const path of Array.from(tracePaths)) {
        const pathEl = path as SVGPathElement
        // Restore original stroke
        const originalStroke = pathEl.dataset.originalStroke
        if (originalStroke) {
          pathEl.setAttribute("stroke", originalStroke)
        }
        pathEl.setAttribute("stroke-width", "2")
        pathEl.style.filter = ""
      }
    },
    [enabled, svgDivRef],
  )

  useEffect(() => {
    if (!enabled) return
    const svg = svgDivRef.current
    if (!svg) return

    // Find all schematic trace elements and add hover listeners
    const traceElements = svg.querySelectorAll(
      '[data-circuit-json-type="schematic_trace"]',
    )

    for (const traceEl of Array.from(traceElements)) {
      traceEl.addEventListener("mouseenter", handleTraceMouseEnter)
      traceEl.addEventListener("mouseleave", handleTraceMouseLeave)
      // Add cursor pointer to indicate interactivity
      ;(traceEl as SVGElement).style.cursor = "pointer"
    }

    // Add CSS for smooth transitions
    if (!svg.querySelector("style#trace-hover-styles")) {
      const style = document.createElement("style")
      style.id = "trace-hover-styles"
      style.textContent = `
        [data-circuit-json-type="schematic_trace"] path {
          transition: stroke 150ms ease, stroke-width 150ms ease, filter 150ms ease;
        }
      `
      svg.appendChild(style)
    }

    return () => {
      for (const traceEl of Array.from(traceElements)) {
        traceEl.removeEventListener("mouseenter", handleTraceMouseEnter)
        traceEl.removeEventListener("mouseleave", handleTraceMouseLeave)
      }
    }
  }, [svgDivRef, circuitJson, enabled, handleTraceMouseEnter, handleTraceMouseLeave])
}
