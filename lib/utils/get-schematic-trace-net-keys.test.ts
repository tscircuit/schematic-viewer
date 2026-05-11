import { expect, test } from "bun:test"
import {
  getSchematicTraceNetKeyMap,
  getSourceTraceNetKeyMap,
} from "./get-schematic-trace-net-keys"

test("groups source traces by shared source ports transitively", () => {
  const sourceTraceNetKeyMap = getSourceTraceNetKeyMap([
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_1", "source_port_2"],
      connected_source_net_ids: [],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_port_ids: ["source_port_2", "source_port_3"],
      connected_source_net_ids: [],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_3",
      connected_source_port_ids: ["source_port_4", "source_port_5"],
      connected_source_net_ids: [],
    },
  ] as any)

  expect(sourceTraceNetKeyMap.get("source_trace_1")).toBe(
    sourceTraceNetKeyMap.get("source_trace_2"),
  )
  expect(sourceTraceNetKeyMap.get("source_trace_1")).not.toBe(
    sourceTraceNetKeyMap.get("source_trace_3"),
  )
})

test("maps schematic trace ids to their source trace net groups", () => {
  const schematicTraceNetKeyMap = getSchematicTraceNetKeyMap([
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_1", "source_port_2"],
      connected_source_net_ids: [],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_port_ids: ["source_port_2", "source_port_3"],
      connected_source_net_ids: [],
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

  expect(schematicTraceNetKeyMap.get("schematic_trace_1")).toBe(
    schematicTraceNetKeyMap.get("schematic_trace_2"),
  )
}
