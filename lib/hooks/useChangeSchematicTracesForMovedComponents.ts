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
              st.connected_source_port_ids?.some((spi) =>
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
              traceElement.setAttribute("stroke-dasharray", "20,20")
              traceElement.style.animation =
                "dash-animation 250ms linear infinite"
              if (!svg.querySelector("style#dash-animation")) {
                const style = document.createElement("style")
                style.id = "dash-animation"
                style.textContent = `
                  @keyframes dash-animation {
                    to {
                      stroke-dashoffset: -40;
                    }
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
  }, [svgDivRef, activeEditEvent, circuitJson])
}
