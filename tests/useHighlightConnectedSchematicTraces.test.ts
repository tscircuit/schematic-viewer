import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSchematicTraceIdsByConnectionKey } from "../lib/hooks/useHighlightConnectedSchematicTraces"

const getGroupedTraceIds = (circuitJson: CircuitJson) =>
  Array.from(getSchematicTraceIdsByConnectionKey(circuitJson).values()).map(
    (traceIds) => Array.from(traceIds).sort(),
  )

test("groups schematic traces connected to the same source net", () => {
  const groupedTraceIds = getGroupedTraceIds([
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
  ] as CircuitJson)

  expect(groupedTraceIds).toContainEqual([
    "schematic_trace_1",
    "schematic_trace_2",
  ])
  expect(groupedTraceIds).toContainEqual(["schematic_trace_3"])
})

test("groups schematic traces connected through source net ports", () => {
  const groupedTraceIds = getGroupedTraceIds([
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_1"],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_port_ids: ["source_port_2"],
    },
    {
      type: "source_net",
      source_net_id: "source_net_1",
      connected_source_port_ids: ["source_port_1", "source_port_2"],
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
  ] as CircuitJson)

  expect(groupedTraceIds).toContainEqual([
    "schematic_trace_1",
    "schematic_trace_2",
  ])
})
