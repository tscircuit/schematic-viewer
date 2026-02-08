import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

/**
 * This hook highlights all connected traces in the same net when hovering over a trace
 */
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

    // Store original colors for restoration
    const originalColors = new Map<Element, string>()
    const HIGHLIGHT_COLOR = "#ff6b6b"

    const getConnectedTraceIds = (schematicTraceId: string): string[] => {
      // Find the schematic trace
      const schematicTrace = su(circuitJson)
        .schematic_trace.list()
        .find((st) => st.schematic_trace_id === schematicTraceId)

      if (!schematicTrace?.source_trace_id) {
        return [schematicTraceId]
      }

      // Find all schematic traces with the same source_trace_id (same net)
      const connectedTraces = su(circuitJson)
        .schematic_trace.list()
        .filter((st) => st.source_trace_id === schematicTrace.source_trace_id)

      return connectedTraces.map((st) => st.schematic_trace_id)
    }

    const highlightTraces = (traceIds: string[]) => {
      for (const traceId of traceIds) {
        const traceElements = svg.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"] path`,
        )
        for (const traceElement of Array.from(traceElements)) {
          if (traceElement.getAttribute("class")?.includes("invisible"))
            continue

          // Store original color if not already stored
          if (!originalColors.has(traceElement)) {
            originalColors.set(
              traceElement,
              traceElement.getAttribute("stroke") || "",
            )
          }

          // Apply highlight color
          traceElement.setAttribute("stroke", HIGHLIGHT_COLOR)
          ;(traceElement as HTMLElement).style.strokeWidth = "7px"
        }
      }
    }

    const resetTraces = (traceIds: string[]) => {
      for (const traceId of traceIds) {
        const traceElements = svg.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"] path`,
        )
        for (const traceElement of Array.from(traceElements)) {
          if (traceElement.getAttribute("class")?.includes("invisible"))
            continue

          // Restore original color
          const originalColor = originalColors.get(traceElement)
          if (originalColor) {
            traceElement.setAttribute("stroke", originalColor)
          }
          ;(traceElement as HTMLElement).style.strokeWidth = ""
        }
      }
    }

    let currentHighlightedTraces: string[] = []

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element
      const traceGroup = target.closest(
        '[data-circuit-json-type="schematic_trace"]',
      )

      if (!traceGroup) return

      const schematicTraceId = traceGroup.getAttribute(
        "data-schematic-trace-id",
      )
      if (!schematicTraceId) return

      // Reset previous highlights
      if (currentHighlightedTraces.length > 0) {
        resetTraces(currentHighlightedTraces)
      }

      // Get all connected trace IDs and highlight them
      currentHighlightedTraces = getConnectedTraceIds(schematicTraceId)
      highlightTraces(currentHighlightedTraces)
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as Element
      const traceGroup = target.closest(
        '[data-circuit-json-type="schematic_trace"]',
      )

      if (!traceGroup) return

      // Check if we're moving to another element within the same trace group
      const relatedTarget = e.relatedTarget as Element | null
      if (relatedTarget && traceGroup.contains(relatedTarget)) {
        return
      }

      // Check if we're moving to another connected trace
      const relatedTraceGroup = relatedTarget?.closest?.(
        '[data-circuit-json-type="schematic_trace"]',
      )
      if (relatedTraceGroup) {
        const relatedTraceId = relatedTraceGroup.getAttribute(
          "data-schematic-trace-id",
        )
        if (
          relatedTraceId &&
          currentHighlightedTraces.includes(relatedTraceId)
        ) {
          return
        }
      }

      // Reset all highlighted traces
      resetTraces(currentHighlightedTraces)
      currentHighlightedTraces = []
    }

    const setupEventListeners = () => {
      svg.addEventListener("mouseover", handleMouseOver)
      svg.addEventListener("mouseout", handleMouseOut)
    }

    // Set up listeners initially
    setupEventListeners()

    // Re-setup listeners when SVG content changes
    const observer = new MutationObserver(() => {
      // Clear stored colors when SVG changes
      originalColors.clear()
      currentHighlightedTraces = []
    })

    observer.observe(svg, {
      childList: true,
      subtree: false,
    })

    return () => {
      svg.removeEventListener("mouseover", handleMouseOver)
      svg.removeEventListener("mouseout", handleMouseOut)
      observer.disconnect()
    }
  }, [svgDivRef, circuitJson])
}
