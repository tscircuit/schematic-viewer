import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTraceIdsToDash } from "../lib/utils/get-trace-ids-to-dash"

const CONNECTIVITY_KEY = "unnamedsubcircuit_source_group_0_connectivity_net0"

// Mirrors real circuit-json output: schematic_trace.source_trace_id is a
// display-style label (e.g. "R1.2-C1.1"), not the actual source_trace_id, so
// it deliberately does NOT match source_trace_0's id below. The only
// reliable link between the two is subcircuit_connectivity_map_key.
const makeCircuitJson = (): CircuitJson =>
  [
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_0",
      source_component_id: "source_component_0",
    },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_1",
      source_component_id: "source_component_1",
    },
    {
      type: "source_port",
      source_port_id: "source_port_0",
      source_component_id: "source_component_0",
    },
    {
      type: "source_port",
      source_port_id: "source_port_1",
      source_component_id: "source_component_1",
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_0",
      connected_source_port_ids: ["source_port_0", "source_port_1"],
      subcircuit_connectivity_map_key: CONNECTIVITY_KEY,
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_0",
      source_trace_id: "R1.2-C1.1",
      subcircuit_connectivity_map_key: CONNECTIVITY_KEY,
    },
  ] as unknown as CircuitJson

const editEventFor = (schematic_component_id: string, suffix = "") => ({
  edit_event_id: `edit_event_${schematic_component_id}${suffix}`,
  edit_event_type: "edit_schematic_component_location" as const,
  schematic_component_id,
  original_center: { x: 0, y: 0 },
  new_center: { x: 1, y: 1 },
  in_progress: false,
  created_at: 0,
})

test("returns no trace ids when there are no edit events", () => {
  const traceIds = getTraceIdsToDash({
    circuitJson: makeCircuitJson(),
    editEvents: [],
    activeEditEvent: null,
  })

  expect(traceIds.size).toBe(0)
})

test("returns the trace ids connected to an actively-edited component", () => {
  const traceIds = getTraceIdsToDash({
    circuitJson: makeCircuitJson(),
    editEvents: [],
    activeEditEvent: editEventFor("schematic_component_0"),
  })

  expect(traceIds).toEqual(new Set(["schematic_trace_0"]))
})

test("skips a stale edit event (removed component) instead of aborting", () => {
  // Regression test: circuit-viewer once used `return` instead of `continue`
  // when a queued edit event referenced a schematic_component_id no longer
  // present in circuitJson, which silently stopped every edit event *after*
  // it in the list from being processed -- including the component actively
  // being dragged.
  const circuitJson = makeCircuitJson().filter(
    (elm: any) => elm.schematic_component_id !== "schematic_component_0",
  ) as CircuitJson

  const traceIds = getTraceIdsToDash({
    circuitJson,
    // Stale: schematic_component_0 has been removed from circuitJson.
    editEvents: [editEventFor("schematic_component_0")],
    // Still valid, and comes after the stale event in processing order.
    activeEditEvent: editEventFor("schematic_component_1"),
  })

  expect(traceIds).toEqual(new Set(["schematic_trace_0"]))
})

test("ignores edit events that aren't schematic component location edits", () => {
  const traceIds = getTraceIdsToDash({
    circuitJson: makeCircuitJson(),
    editEvents: [
      {
        edit_event_id: "edit_event_other",
        edit_event_type: "edit_pcb_component_location" as any,
        pcb_component_id: "pcb_component_0",
        original_center: { x: 0, y: 0 },
        new_center: { x: 1, y: 1 },
        in_progress: false,
        created_at: 0,
      } as any,
    ],
    activeEditEvent: null,
  })

  expect(traceIds.size).toBe(0)
})
