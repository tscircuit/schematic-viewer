import { useEffect, useRef } from "react"
import { su } from "@tscircuit/soup-util"
import type { ManualEditEvent } from "../types/edit-events"
import type { CircuitJson } from "circuit-json"

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

      // If there's an active edit event, make connected traces dashed
      for (const editEvent of [
        ...editEvents,
        ...(activeEditEvent ? [activeEditEvent] : []),
      ]) {
        if (
          "schematic_component_id" in editEvent &&
          editEvent.edit_event_type === "edit_schematic_component_location"
        ) {
          const sch_component = su(circuitJson).schematic_component.get(
            editEvent.schematic_component_id,
          )
          if (!sch_component) return

          const src_ports = su(circuitJson).source_port.list({
            source_component_id: sch_component.source_component_id,
          })
          const src_port_ids = new Set(src_ports.map((sp) => sp.source_port_id))
          const src_traces = su(circuitJson)
            .source_trace.list()
            .filter((st) =>
              st.connected_source_port_ids?.some((spi: string) =>
                src_port_ids.has(spi),
              ),
            )
          const src_trace_ids = new Set(
            src_traces.map((st) => st.source_trace_id),
          )
          const schematic_traces = su(circuitJson)
            .schematic_trace.list()
            .filter((st) => src_trace_ids.has(st.source_trace_id))

          // Make the connected traces dashed
          schematic_traces.forEach((trace) => {
            const traceElements = svg.querySelectorAll(
              `[data-schematic-trace-id="${trace.schematic_trace_id}"] path`,
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
          })
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
