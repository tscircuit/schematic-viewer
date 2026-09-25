import type { CircuitJson } from "circuit-json"
import { SchematicViewer } from "lib/components/SchematicViewer"

const circuitJson: CircuitJson = [
  {
    type: "source_trace",
    source_trace_id: "source_trace_signal_a",
    connected_source_port_ids: [],
    connected_source_net_ids: [],
    subcircuit_connectivity_map_key: "signal_a",
  },
  {
    type: "source_trace",
    source_trace_id: "source_trace_signal_b",
    connected_source_port_ids: [],
    connected_source_net_ids: [],
    subcircuit_connectivity_map_key: "signal_b",
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "schematic_trace_signal_a",
    source_trace_id: "source_trace_signal_a",
    subcircuit_connectivity_map_key: "signal_a",
    junctions: [],
    edges: [{ from: { x: -4, y: 1 }, to: { x: 4, y: 1 } }],
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "schematic_trace_signal_b",
    source_trace_id: "source_trace_signal_b",
    subcircuit_connectivity_map_key: "signal_b",
    junctions: [],
    edges: [{ from: { x: -4, y: -1 }, to: { x: 4, y: -1 } }],
  },
  {
    type: "schematic_text",
    schematic_text_id: "schematic_text_signal_a",
    source_trace_id: "source_trace_signal_a",
    text: "SIGNAL_A",
    position: { x: 0, y: 1.25 },
    anchor: "bottom_center",
    rotation: 0,
    font_size: 0.25,
    color: "rgb(132, 0, 0)",
  },
  {
    type: "schematic_text",
    schematic_text_id: "schematic_text_signal_b",
    source_trace_id: "source_trace_signal_b",
    text: "SIGNAL_B",
    position: { x: 0, y: -0.75 },
    anchor: "bottom_center",
    rotation: 0,
    font_size: 0.25,
    color: "rgb(132, 0, 0)",
  },
  {
    type: "schematic_text",
    schematic_text_id: "schematic_text_instruction",
    text: "Hover either inline label",
    position: { x: 0, y: 2.2 },
    anchor: "center",
    rotation: 0,
    font_size: 0.22,
    color: "#006464",
  },
]

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
