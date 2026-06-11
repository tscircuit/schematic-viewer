import type { CircuitJson } from "circuit-json"
import { SchematicViewer } from "lib/components/SchematicViewer"

const circuitJson = [
  {
    type: "source_net",
    source_net_id: "source_net_gnd",
    name: "GND",
  },
  {
    type: "source_net",
    source_net_id: "source_net_signal",
    name: "SIGNAL",
  },
  {
    type: "source_trace",
    source_trace_id: "source_trace_gnd_left",
    connected_source_net_ids: ["source_net_gnd"],
    connected_source_port_ids: [],
  },
  {
    type: "source_trace",
    source_trace_id: "source_trace_gnd_right",
    connected_source_net_ids: ["source_net_gnd"],
    connected_source_port_ids: [],
  },
  {
    type: "source_trace",
    source_trace_id: "source_trace_signal",
    connected_source_net_ids: ["source_net_signal"],
    connected_source_port_ids: [],
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "schematic_trace_gnd_left",
    source_trace_id: "source_trace_gnd_left",
    edges: [{ from: { x: -4, y: 1 }, to: { x: -1, y: 1 } }],
    junctions: [{ x: -1, y: 1 }],
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "schematic_trace_gnd_right",
    source_trace_id: "source_trace_gnd_right",
    edges: [{ from: { x: 1, y: 1 }, to: { x: 4, y: 1 } }],
    junctions: [{ x: 1, y: 1 }],
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "schematic_trace_signal",
    source_trace_id: "source_trace_signal",
    edges: [{ from: { x: -4, y: -1 }, to: { x: 4, y: -1 } }],
    junctions: [],
  },
] as CircuitJson

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ height: "100%" }}
    debugGrid
  />
)
