import type { CircuitJson } from "circuit-json"
import { ControlledSchematicViewer } from "lib/components/ControlledSchematicViewer"

const circuitJson = [
  {
    type: "source_port",
    source_port_id: "source_port_0",
    subcircuit_connectivity_map_key: "hover_net_a",
  },
  {
    type: "source_port",
    source_port_id: "source_port_1",
    subcircuit_connectivity_map_key: "hover_net_a",
  },
  {
    type: "schematic_port",
    schematic_port_id: "schematic_port_0",
    source_port_id: "source_port_0",
    center: { x: 0, y: 0 },
  },
  {
    type: "schematic_port",
    schematic_port_id: "schematic_port_1",
    source_port_id: "source_port_1",
    center: { x: 4, y: 0 },
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "trace_0",
    edges: [{ from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }],
    junctions: [{ x: 1, y: 0 }],
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "trace_1",
    edges: [{ from: { x: 1, y: 0 }, to: { x: 3, y: 0 } }],
    junctions: [
      { x: 1, y: 0 },
      { x: 3, y: 0 },
    ],
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "trace_2",
    edges: [{ from: { x: 3, y: 0 }, to: { x: 4, y: 0 } }],
    junctions: [{ x: 3, y: 0 }],
  },
  {
    type: "schematic_trace",
    schematic_trace_id: "trace_3",
    edges: [{ from: { x: 0, y: 2 }, to: { x: 4, y: 2 } }],
    junctions: [],
  },
] as CircuitJson

export default () => (
  <ControlledSchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ height: "100%" }}
    debugGrid
  />
)
