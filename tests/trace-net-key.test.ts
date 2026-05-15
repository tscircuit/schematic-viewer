import { expect, test } from "bun:test"
import { getSchematicTraceNetKeyByTraceId } from "../lib/hooks/useHighlightConnectedSchematicTraces"

test("uses explicit connectivity keys for schematic traces", () => {
  const keys = getSchematicTraceNetKeyByTraceId([
    {
      type: "schematic_trace",
      schematic_trace_id: "trace_1",
      subcircuit_connectivity_map_key: "net.GND",
      edges: [],
    } as any,
    {
      type: "schematic_trace",
      schematic_trace_id: "trace_2",
      subcircuit_connectivity_map_key: "net.GND",
      edges: [],
    } as any,
    {
      type: "schematic_trace",
      schematic_trace_id: "trace_3",
      subcircuit_connectivity_map_key: "net.VCC",
      edges: [],
    } as any,
  ])

  expect(keys.get("trace_1")).toBe("net.GND")
  expect(keys.get("trace_2")).toBe("net.GND")
  expect(keys.get("trace_3")).toBe("net.VCC")
})

test("falls back to shared endpoints when traces do not have connectivity keys", () => {
  const keys = getSchematicTraceNetKeyByTraceId([
    {
      type: "schematic_trace",
      schematic_trace_id: "trace_1",
      edges: [{ from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }],
    } as any,
    {
      type: "schematic_trace",
      schematic_trace_id: "trace_2",
      edges: [{ from: { x: 1, y: 0 }, to: { x: 2, y: 0 } }],
    } as any,
    {
      type: "schematic_trace",
      schematic_trace_id: "trace_3",
      edges: [{ from: { x: 5, y: 5 }, to: { x: 6, y: 5 } }],
    } as any,
  ])

  const firstTraceKey = keys.get("trace_1")
  const secondTraceKey = keys.get("trace_2")
  const thirdTraceKey = keys.get("trace_3")

  if (!firstTraceKey || !secondTraceKey || !thirdTraceKey) {
    throw new Error("Expected every test trace to receive a net key")
  }

  expect(firstTraceKey).toBe(secondTraceKey)
  expect(firstTraceKey).not.toBe(thirdTraceKey)
})
