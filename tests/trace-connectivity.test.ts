import { describe, expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getConnectedSchematicTraceIds } from "../lib/utils/trace-connectivity"

describe("getConnectedSchematicTraceIds", () => {
  test("connects traces that share a source net", () => {
    const circuitJson = [
      {
        type: "source_trace",
        source_trace_id: "source_trace_1",
        connected_source_net_ids: ["source_net_1"],
      },
      {
        type: "source_trace",
        source_trace_id: "source_trace_2",
        connected_source_net_ids: ["source_net_1"],
      },
      {
        type: "source_trace",
        source_trace_id: "source_trace_3",
        connected_source_net_ids: ["source_net_2"],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_1",
        source_trace_id: "source_trace_1",
        edges: [],
        junctions: [],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_2",
        source_trace_id: "source_trace_2",
        edges: [],
        junctions: [],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_3",
        source_trace_id: "source_trace_3",
        edges: [],
        junctions: [],
      },
    ] as CircuitJson

    expect(
      getConnectedSchematicTraceIds(circuitJson, "schematic_trace_1"),
    ).toEqual(["schematic_trace_1", "schematic_trace_2"])
  })

  test("falls back to source trace connectivity keys", () => {
    const circuitJson = [
      {
        type: "source_trace",
        source_trace_id: "source_trace_1",
        connected_source_net_ids: [],
        subcircuit_connectivity_map_key: "net0",
      },
      {
        type: "source_trace",
        source_trace_id: "source_trace_2",
        connected_source_net_ids: [],
        subcircuit_connectivity_map_key: "net0",
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_1",
        source_trace_id: "source_trace_1",
        edges: [],
        junctions: [],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_2",
        source_trace_id: "source_trace_2",
        edges: [],
        junctions: [],
      },
    ] as CircuitJson

    expect(
      getConnectedSchematicTraceIds(circuitJson, "schematic_trace_1"),
    ).toEqual(["schematic_trace_1", "schematic_trace_2"])
  })

  test("connects traces through shared source ports when no net id exists", () => {
    const circuitJson = [
      {
        type: "source_trace",
        source_trace_id: "source_trace_1",
        connected_source_net_ids: [],
        connected_source_port_ids: ["source_port_1", "source_port_2"],
      },
      {
        type: "source_trace",
        source_trace_id: "source_trace_2",
        connected_source_net_ids: [],
        connected_source_port_ids: ["source_port_2", "source_port_3"],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_1",
        source_trace_id: "source_trace_1",
        edges: [],
        junctions: [],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_2",
        source_trace_id: "source_trace_2",
        edges: [],
        junctions: [],
      },
    ] as CircuitJson

    expect(
      getConnectedSchematicTraceIds(circuitJson, "schematic_trace_1"),
    ).toEqual(["schematic_trace_1", "schematic_trace_2"])
  })
})
