import { useEffect, useRef } from "react"
import type { ManualEditEvent } from "../types/edit-events"
import type { CircuitJson } from "circuit-json"
import { getTraceIdsToDash } from "../utils/get-trace-ids-to-dash"

/**
 * This hook makes traces dashed when their connected components are being moved
 */
export const useChangeSchematicTracesForMovedComponents = ({
  svgDivRef,
  circuitJson,
  activeEditEvent,
  editEvents,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  activeEditEvent: ManualEditEvent | null
  editEvents: ManualEditEvent[]
}) => {
  // Keep track of the last known SVG content
  const lastSvgContentRef = useRef<string | null>(null)

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const updateTraceStyles = () => {
      // Reset all traces to solid
      const allTraces = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"] path',
      )

      // Reset all traces to solid
      for (const trace of Array.from(allTraces)) {
        trace.setAttribute("stroke-dasharray", "0")
        ;(trace as any).style.animation = ""
      }

      // Make traces connected to a moved (or moving) component dashed
      const traceIdsToDash = getTraceIdsToDash({
        circuitJson,
        editEvents,
        activeEditEvent,
      })

      for (const schematicTraceId of traceIdsToDash) {
        const traceElements = svg.querySelectorAll(
          `[data-schematic-trace-id="${schematicTraceId}"] path`,
        )
        for (const traceElement of Array.from(traceElements)) {
          if (traceElement.getAttribute("class")?.includes("invisible"))
            continue
          traceElement.setAttribute("stroke-dasharray", "20,20")
          ;(traceElement as any).style.animation =
            "dash-animation 350ms linear infinite, pulse-animation 900ms linear infinite"

          if (!svg.querySelector("style#dash-animation")) {
            const style = document.createElement("style")
            style.id = "dash-animation"
            style.textContent = `
              @keyframes dash-animation {
                to {
                  stroke-dashoffset: -40;
                }
              }
              @keyframes pulse-animation {
                0% { opacity: 0.6; }
                50% { opacity: 0.2; }
                100% { opacity: 0.6; }
              }
            `
            svg.appendChild(style)
          }
        }
      }
    }

    // Apply styles immediately
    updateTraceStyles()

    // Cleanup function
    const observer = new MutationObserver(updateTraceStyles)
    observer.observe(svg, {
      childList: true, // Watch for changes to the child elements
      subtree: false, // Watch for changes in the entire subtree
      characterData: false, // Watch for changes to text content
    })

    return () => {
      observer.disconnect()
    }
  }, [svgDivRef, activeEditEvent, circuitJson, editEvents])
}
