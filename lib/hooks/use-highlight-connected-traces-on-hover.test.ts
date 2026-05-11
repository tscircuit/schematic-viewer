import { expect, test } from "bun:test"
import { getSchematicTraceHoverKeys } from "./use-highlight-connected-traces-on-hover"

test("groups schematic traces by net connectivity instead of source trace id", () => {
  const circuitJson = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_1"],
      connected_source_net_ids: ["source_net_vout"],
      subcircuit_connectivity_map_key: "main.vout",
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_port_ids: ["source_port_2"],
      connected_source_net_ids: ["source_net_vout"],
      subcircuit_connectivity_map_key: "main.vout",
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_3",
      connected_source_port_ids: ["source_port_3"],
      connected_source_net_ids: ["source_net_gnd"],
      subcircuit_connectivity_map_key: "main.gnd",
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
  ] as any

  const hoverKeys = getSchematicTraceHoverKeys(circuitJson)
  const voutHoverKey = hoverKeys.get("schematic_trace_1")
  const gndHoverKey = hoverKeys.get("schematic_trace_3")

  if (!voutHoverKey || !gndHoverKey) {
    throw new Error("Expected schematic traces to have hover keys")
  }

  expect(hoverKeys.get("schematic_trace_2")).toBe(voutHoverKey)
  expect(voutHoverKey).not.toBe(gndHoverKey)
})

test("falls back to connected source net ids when no connectivity key exists", () => {
  const circuitJson = [
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_1"],
      connected_source_net_ids: ["source_net_vout"],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_port_ids: ["source_port_2"],
      connected_source_net_ids: ["source_net_vout"],
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
  ] as any

  const hoverKeys = getSchematicTraceHoverKeys(circuitJson)
  const hoverKey = hoverKeys.get("schematic_trace_1")

  if (!hoverKey) {
    throw new Error("Expected schematic trace to have a hover key")
  }

  expect(hoverKeys.get("schematic_trace_2")).toBe(hoverKey)
})
