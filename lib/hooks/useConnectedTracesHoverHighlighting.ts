import { useEffect, useRef } from "react"
import type { CircuitJson } from "circuit-json"
import { findConnectedTraceIds } from "../utils/trace-connectivity"

/**
 * Hook that adds hover highlighting functionality to schematic traces.
 * When hovering over a trace, all electrically connected traces in the same net
 * will be highlighted with an orange glow effect.
 */
export const useConnectedTracesHoverHighlighting = ({
  svgDivRef,
  circuitJson,
  enabled = true,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  enabled?: boolean
}) => {
  const highlightedTracesRef = useRef<Set<string>>(new Set())
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return

    const svgElement = svgDivRef.current
    if (!svgElement) return

    const handleTraceMouseEnter = (event: Event) => {
      const target = event.target as Element
      const traceGroup = target.closest("[data-schematic-trace-id]")
      if (!traceGroup) return

      const traceId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!traceId) return

      // Clear any pending unhighlight timeout
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
        highlightTimeoutRef.current = null
      }

      const connectedTraces = findConnectedTraceIds(circuitJson, traceId)

      // Clear previous highlights
      highlightedTracesRef.current.forEach((highlightedTraceId) => {
        const traceElement = svgElement.querySelector(
          `[data-schematic-trace-id="${highlightedTraceId}"]`,
        )
        if (traceElement) {
          traceElement.classList.remove("trace-highlighted")
        }
      })

      // Highlight all connected traces
      const newHighlightedTraces = new Set<string>()
      connectedTraces.forEach((connectedTraceId) => {
        const traceElement = svgElement.querySelector(
          `[data-schematic-trace-id="${connectedTraceId}"]`,
        )
        if (traceElement) {
          traceElement.classList.add("trace-highlighted")
          newHighlightedTraces.add(connectedTraceId)
        }
      })

      highlightedTracesRef.current = newHighlightedTraces
    }

    const handleTraceMouseLeave = (event: Event) => {
      // Add small delay to prevent flickering when moving between connected traces
      highlightTimeoutRef.current = setTimeout(() => {
        highlightedTracesRef.current.forEach((highlightedTraceId) => {
          const traceElement = svgElement.querySelector(
            `[data-schematic-trace-id="${highlightedTraceId}"]`,
          )
          if (traceElement) {
            traceElement.classList.remove("trace-highlighted")
          }
        })
        highlightedTracesRef.current.clear()
      }, 50)
    }

    const addEventListeners = () => {
      const traceElements = svgElement.querySelectorAll(
        "[data-schematic-trace-id]",
      )

      // Inject CSS styles if not already present
      if (!svgElement.querySelector("style#trace-highlighting-styles")) {
        const style = document.createElement("style")
        style.id = "trace-highlighting-styles"
        style.textContent = `
          .trace-highlighted {
            stroke-width: 3 !important;
            stroke: #ff6b35 !important;
            filter: drop-shadow(0 0 3px rgba(255, 107, 53, 0.6)) !important;
            transition: all 0.15s ease-in-out !important;
            z-index: 100 !important;
          }
          
          [data-schematic-trace-id] {
            cursor: pointer;
          }
          
          [data-schematic-trace-id]:hover {
            opacity: 0.8;
          }
          
          [data-schematic-trace-id].trace-highlighted:hover {
            opacity: 1;
          }
        `
        svgElement.appendChild(style)
      }

      traceElements.forEach((traceElement) => {
        traceElement.addEventListener("mouseenter", handleTraceMouseEnter)
        traceElement.addEventListener("mouseleave", handleTraceMouseLeave)
      })
    }

    const removeEventListeners = () => {
      const traceElements = svgElement.querySelectorAll(
        "[data-schematic-trace-id]",
      )

      traceElements.forEach((traceElement) => {
        traceElement.removeEventListener("mouseenter", handleTraceMouseEnter)
        traceElement.removeEventListener("mouseleave", handleTraceMouseLeave)
      })
    }

    addEventListeners()

    const observer = new MutationObserver(() => {
      removeEventListeners()
      addEventListeners()
    })

    observer.observe(svgElement, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      removeEventListeners()

      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }

      // Clear any remaining highlights
      highlightedTracesRef.current.forEach((highlightedTraceId) => {
        const traceElement = svgElement?.querySelector(
          `[data-schematic-trace-id="${highlightedTraceId}"]`,
        )
        if (traceElement) {
          traceElement.classList.remove("trace-highlighted")
        }
      })
      highlightedTracesRef.current.clear()
    }
  }, [svgDivRef, circuitJson, enabled])
}
