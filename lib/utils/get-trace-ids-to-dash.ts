import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import type { ManualEditEvent } from "../types/edit-events"

/**
 * Returns the schematic_trace_ids that should render dashed because they're
 * connected to a component currently being moved (an active drag, or a
 * queued edit event).
 *
 * A stale edit event -- one whose schematic_component_id no longer resolves
 * against circuitJson, e.g. because the component was removed -- is skipped
 * rather than aborting, so it doesn't prevent later, still-valid edit events
 * from being processed.
 */
export const getTraceIdsToDash = ({
  circuitJson,
  editEvents,
  activeEditEvent,
}: {
  circuitJson: CircuitJson
  editEvents: ManualEditEvent[]
  activeEditEvent: ManualEditEvent | null
}): Set<string> => {
  const traceIds = new Set<string>()

  for (const editEvent of [
    ...editEvents,
    ...(activeEditEvent ? [activeEditEvent] : []),
  ]) {
    if (
      !("schematic_component_id" in editEvent) ||
      editEvent.edit_event_type !== "edit_schematic_component_location"
    ) {
      continue
    }

    const sch_component = su(circuitJson).schematic_component.get(
      editEvent.schematic_component_id,
    )
    if (!sch_component) continue

    const src_ports = su(circuitJson).source_port.list({
      source_component_id: sch_component.source_component_id,
    })
    const src_port_ids = new Set(src_ports.map((sp) => sp.source_port_id))

    // schematic_trace only reliably links back to source_trace via
    // subcircuit_connectivity_map_key -- source_trace_id on schematic_trace
    // is a display-style label (e.g. "R1.2-C1.1"), not a real
    // source_trace_id, so it can't be used to join the two. This is the same
    // key useSchematicNetHover uses to relate traces to nets.
    const connectivityKeys = new Set(
      su(circuitJson)
        .source_trace.list()
        .filter((st) =>
          st.connected_source_port_ids?.some((spi: string) =>
            src_port_ids.has(spi),
          ),
        )
        .map((st) => st.subcircuit_connectivity_map_key)
        .filter((key): key is string => Boolean(key)),
    )

    const schematic_traces = su(circuitJson)
      .schematic_trace.list()
      .filter(
        (st) =>
          st.subcircuit_connectivity_map_key &&
          connectivityKeys.has(st.subcircuit_connectivity_map_key),
      )

    for (const trace of schematic_traces) {
      traceIds.add(trace.schematic_trace_id!)
    }
  }

  return traceIds
}
