import { expect, test } from "bun:test"
import { addSubcircuitConnectivityMapKeysToSchematicTraces } from "lib/utils/add-subcircuit-connectivity-map-keys-to-schematic-traces"

test("adds subcircuit connectivity keys to solver-generated schematic traces", () => {
  const circuitJson = [
    {
      type: "source_component",
      source_component_id: "source_component_0",
      name: "R1",
    },
    {
      type: "source_component",
      source_component_id: "source_component_1",
      name: "C1",
    },
    {
      type: "source_port",
      source_port_id: "source_port_0",
      source_component_id: "source_component_0",
      pin_number: 2,
      name: "pin2",
      port_hints: ["pin2", "2"],
      subcircuit_connectivity_map_key: "net0",
    },
    {
      type: "source_port",
      source_port_id: "source_port_1",
      source_component_id: "source_component_1",
      pin_number: 1,
      name: "pin1",
      port_hints: ["pin1", "1"],
      subcircuit_connectivity_map_key: "net0",
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_0",
      source_trace_id: "solver_R1.2-C1.1",
      edges: [],
      junctions: [],
    },
  ] as any

  const nextCircuitJson =
    addSubcircuitConnectivityMapKeysToSchematicTraces(circuitJson)

  expect((nextCircuitJson as any)[4].subcircuit_connectivity_map_key).toBe(
    "net0",
  )
})
