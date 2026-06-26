import { expect, test } from "bun:test"
import { getConnectedSchematicTraceIdsByHoveredTrace } from "../lib/utils/getConnectedSchematicTraceIdsByHoveredTrace"

const sorted = (values: Set<string> | undefined) =>
  Array.from(values ?? []).sort()

test("groups schematic traces through shared source net ids", () => {
  const groups = getConnectedSchematicTraceIdsByHoveredTrace([
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_net_ids: ["source_net_gnd"],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_net_ids: ["source_net_gnd"],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_3",
      connected_source_net_ids: ["source_net_vcc"],
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_1",
      source_trace_id: "source_trace_1",
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_2",
      source_trace_id: "source_trace_2",
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_3",
      source_trace_id: "source_trace_3",
    },
  ] as any)

  expect(sorted(groups.get("schematic_trace_1"))).toEqual([
    "schematic_trace_1",
    "schematic_trace_2",
  ])
  expect(sorted(groups.get("schematic_trace_3"))).toEqual(["schematic_trace_3"])
})

test("falls back to connected source ports when source nets are missing", () => {
  const groups = getConnectedSchematicTraceIdsByHoveredTrace([
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_shared", "source_port_a"],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_port_ids: ["source_port_shared", "source_port_b"],
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_1",
      source_trace_id: "source_trace_1",
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_2",
      source_trace_id: "source_trace_2",
    },
  ] as any)

  expect(sorted(groups.get("schematic_trace_1"))).toEqual([
    "schematic_trace_1",
    "schematic_trace_2",
  ])
})

test("groups multiple schematic segments from the same source trace", () => {
  const groups = getConnectedSchematicTraceIdsByHoveredTrace([
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_1",
      source_trace_id: "source_trace_1",
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_2",
      source_trace_id: "source_trace_1",
    },
  ] as any)

  expect(sorted(groups.get("schematic_trace_1"))).toEqual([
    "schematic_trace_1",
    "schematic_trace_2",
  ])
})

test("resolves solver-generated source trace ids through source port connectivity", () => {
  const groups = getConnectedSchematicTraceIdsByHoveredTrace([
    {
      type: "source_component",
      source_component_id: "source_component_r1",
      name: "R1",
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
      name: "pin1",
      pin_number: 1,
      subcircuit_connectivity_map_key: "connectivity_gnd",
    },
    {
      type: "source_port",
      source_port_id: "source_port_c1_1",
      source_component_id: "source_component_c1",
      name: "pin1",
      pin_number: 1,
      subcircuit_connectivity_map_key: "connectivity_gnd",
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_direct",
      connected_source_port_ids: ["source_port_c1_1"],
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_solver",
      source_trace_id: "solver_R1.1-C1.1",
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_direct",
      source_trace_id: "source_trace_direct",
    },
  ] as any)

  expect(sorted(groups.get("schematic_trace_solver"))).toEqual([
    "schematic_trace_direct",
    "schematic_trace_solver",
  ])
})
