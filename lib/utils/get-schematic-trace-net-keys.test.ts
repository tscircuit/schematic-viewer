import { expect, test } from "bun:test"
import {
  getSchematicTraceNetKeyMap,
  getSourceTraceNetKeyMap,
  getSameNetSchematicTraceIdsMap,
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

  expect(sourceTraceNetKeyMap.get("source_trace_1")!).toBe(
    sourceTraceNetKeyMap.get("source_trace_2")!,
  )
  expect(sourceTraceNetKeyMap.get("source_trace_1")!).not.toBe(
    sourceTraceNetKeyMap.get("source_trace_3")!,
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

  expect(schematicTraceNetKeyMap.get("schematic_trace_1")!).toBe(
    schematicTraceNetKeyMap.get("schematic_trace_2")!,
  )
})

test("groups source traces by shared nets", () => {
  const sourceTraceNetKeyMap = getSourceTraceNetKeyMap([
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: [],
      connected_source_net_ids: ["net_1"],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_port_ids: [],
      connected_source_net_ids: ["net_1"],
    },
  ] as any)

  expect(sourceTraceNetKeyMap.get("source_trace_1")!).toBe(
    sourceTraceNetKeyMap.get("source_trace_2")!,
  )
})

test("groups source traces by subcircuit_connectivity_map_key", () => {
  const sourceTraceNetKeyMap = getSourceTraceNetKeyMap([
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: [],
      connected_source_net_ids: [],
      subcircuit_connectivity_map_key: "sub_1",
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_port_ids: [],
      connected_source_net_ids: [],
      subcircuit_connectivity_map_key: "sub_1",
    },
  ] as any)

  expect(sourceTraceNetKeyMap.get("source_trace_1")!).toBe(
    sourceTraceNetKeyMap.get("source_trace_2")!,
  )
})

test("getSameNetSchematicTraceIdsMap returns same Set for same-net traces", () => {
  const sameNetMap = getSameNetSchematicTraceIdsMap([
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_port_ids: ["source_port_1"],
      connected_source_net_ids: [],
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_2",
      connected_source_port_ids: ["source_port_1"],
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

  const set1 = sameNetMap.get("schematic_trace_1")!
  const set2 = sameNetMap.get("schematic_trace_2")!
  expect(set1).toBe(set2)
  expect(set1.has("schematic_trace_1")).toBe(true)
  expect(set1.has("schematic_trace_2")).toBe(true)
  expect(set1.size).toBe(2)
})
