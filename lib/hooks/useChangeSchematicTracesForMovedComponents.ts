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
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  activeEditEvent: ManualEditEvent | null
}) => {
  // Keep track of the last known SVG content
  const lastSvgContentRef = useRef<string | null>(null)

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    // Create a MutationObserver to watch for changes in the div's content
    const observer = new MutationObserver((mutations) => {
      updateTraceStyles()
    })

    const updateTraceStyles = () => {
      // Reset all traces to solid
      const allTraces = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"] path',
      )
      allTraces.forEach((trace) => {
        trace.setAttribute("stroke-dasharray", "")
      })

      // If there's an active edit event, make connected traces dashed
      if (
        activeEditEvent &&
        "schematic_component_id" in activeEditEvent &&
        activeEditEvent.edit_event_type === "edit_schematic_component_location"
      ) {
        const sch_component = su(circuitJson).schematic_component.get(
          activeEditEvent.schematic_component_id,
        )
        if (!sch_component) return

        const src_ports = su(circuitJson).source_port.list({
          source_component_id: sch_component.source_component_id,
        })
        const src_port_ids = new Set(src_ports.map((sp) => sp.source_port_id))
        const src_traces = su(circuitJson)
          .source_trace.list()
          .filter((st) =>
            st.connected_source_port_ids?.some((spi) => src_port_ids.has(spi)),
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
            traceElement.setAttribute("stroke-dasharray", "10,10")
          }
        })
      }
    }

    // Start observing the div for changes
    observer.observe(svg, {
      childList: true,
      subtree: false,
      characterData: false,
    })

    // Apply styles immediately
    updateTraceStyles()

    // Cleanup function
    return () => {
      observer.disconnect()
    }
  }, [svgDivRef, activeEditEvent, circuitJson])
}
