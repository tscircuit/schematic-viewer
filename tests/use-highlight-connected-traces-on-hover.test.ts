import { describe, expect, test } from "bun:test"
import { getConnectedSchematicTraceIdsByHoveredTrace } from "lib/hooks/useHighlightConnectedTracesOnHover"

const getConnectedTraceIds = (
  circuitJson: any[],
  hoveredSchematicTraceId: string,
) =>
  [
    ...(getConnectedSchematicTraceIdsByHoveredTrace(circuitJson as any).get(
      hoveredSchematicTraceId,
    ) ?? []),
  ].sort()

describe("getConnectedSchematicTraceIdsByHoveredTrace", () => {
  test("groups traces through connected source net ids", () => {
    const circuitJson = [
      {
        type: "source_trace",
        source_trace_id: "source_trace_gnd_a",
        connected_source_net_ids: ["source_net_gnd"],
      },
      {
        type: "source_trace",
        source_trace_id: "source_trace_gnd_b",
        connected_source_net_ids: ["source_net_gnd"],
      },
      {
        type: "source_trace",
        source_trace_id: "source_trace_sig",
        connected_source_net_ids: ["source_net_sig"],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_gnd_a",
        source_trace_id: "source_trace_gnd_a",
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_gnd_b",
        source_trace_id: "source_trace_gnd_b",
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_sig",
        source_trace_id: "source_trace_sig",
      },
    ]

    expect(getConnectedTraceIds(circuitJson, "schematic_trace_gnd_a")).toEqual([
      "schematic_trace_gnd_a",
      "schematic_trace_gnd_b",
    ])
  })

  test("falls back to connected source ports when net ids are unavailable", () => {
    const circuitJson = [
      {
        type: "source_trace",
        source_trace_id: "source_trace_a",
        connected_source_port_ids: ["source_port_shared"],
      },
      {
        type: "source_trace",
        source_trace_id: "source_trace_b",
        connected_source_port_ids: ["source_port_shared"],
      },
      {
        type: "source_trace",
        source_trace_id: "source_trace_c",
        connected_source_port_ids: ["source_port_other"],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_a",
        source_trace_id: "source_trace_a",
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_b",
        source_trace_id: "source_trace_b",
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_c",
        source_trace_id: "source_trace_c",
      },
    ]

    expect(getConnectedTraceIds(circuitJson, "schematic_trace_a")).toEqual([
      "schematic_trace_a",
      "schematic_trace_b",
    ])
  })

  test("resolves solver trace endpoints through source port connectivity keys", () => {
    const circuitJson = [
      {
        type: "source_component",
        source_component_id: "source_component_r1",
        name: "R1",
      },
      {
        type: "source_component",
        source_component_id: "source_component_u1",
        name: "U1",
      },
      {
        type: "source_component",
        source_component_id: "source_component_c1",
        name: "C1",
      },
      {
        type: "source_port",
        source_port_id: "source_port_r1_1",
        source_component_id: "source_component_r1",
        pin_number: "1",
        subcircuit_connectivity_map_key: "net_gnd",
      },
      {
        type: "source_port",
        source_port_id: "source_port_r1_2",
        source_component_id: "source_component_r1",
        pin_number: "2",
        subcircuit_connectivity_map_key: "net_sig",
      },
      {
        type: "source_port",
        source_port_id: "source_port_u1_4",
        source_component_id: "source_component_u1",
        pin_number: "4",
        subcircuit_connectivity_map_key: "net_gnd",
      },
      {
        type: "source_port",
        source_port_id: "source_port_c1_1",
        source_component_id: "source_component_c1",
        pin_number: "1",
        subcircuit_connectivity_map_key: "net_sig",
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_gnd_a",
        source_trace_id: "solver_R1.1-U1.4",
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_gnd_b",
        source_trace_id: "solver_U1.4-R1.1",
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "schematic_trace_sig",
        source_trace_id: "solver_R1.2-C1.1",
      },
    ]

    expect(getConnectedTraceIds(circuitJson, "schematic_trace_gnd_a")).toEqual([
      "schematic_trace_gnd_a",
      "schematic_trace_gnd_b",
    ])
  })
})
