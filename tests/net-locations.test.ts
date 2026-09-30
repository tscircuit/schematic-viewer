import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import {
  getNetLocations,
  getNetKeyAtElement,
} from "../lib/utils/get-net-locations"
import { JSDOM } from "jsdom"

const trace = (
  id: string,
  sheet: string,
  from: number[],
  to: number[],
  extra = {},
) => ({
  type: "schematic_trace",
  schematic_trace_id: id,
  schematic_sheet_id: sheet,
  subcircuit_connectivity_map_key: "power",
  source_trace_id: "source",
  junctions: [],
  edges: [{ from: { x: from[0], y: from[1] }, to: { x: to[0], y: to[1] } }],
  ...extra,
})
const fixture = [
  { type: "schematic_sheet", schematic_sheet_id: "s1", name: "Sheet 1" },
  { type: "schematic_sheet", schematic_sheet_id: "s3", name: "Sheet 3" },
  {
    type: "source_trace",
    source_trace_id: "source",
    subcircuit_connectivity_map_key: "power",
    connected_source_port_ids: ["p1"],
    connected_source_net_ids: ["net"],
  },
  {
    type: "source_net",
    source_net_id: "net",
    name: "PWR",
    subcircuit_connectivity_map_key: "power",
  },
  {
    type: "source_component",
    source_component_id: "u1",
    name: "U1",
    ftype: "simple_chip",
  },
  {
    type: "source_port",
    source_port_id: "p1",
    source_component_id: "u1",
    name: "PWR",
  },
  {
    type: "schematic_port",
    schematic_port_id: "sp1",
    source_port_id: "p1",
    schematic_sheet_id: "s1",
    center: { x: 0, y: 0 },
  },
  trace("a", "s1", [0, 0], [2, 0]),
  trace("branch", "s1", [1, 0], [1, 1]),
  trace("cross", "s1", [0.5, -1], [0.5, 1]),
  trace("other-sheet", "s3", [0, 0], [2, 0]),
  {
    type: "schematic_net_label",
    schematic_net_label_id: "label",
    source_net_id: "net",
    text: "PWR",
    schematic_sheet_id: "s1",
    center: { x: 0, y: 0 },
    anchor_position: { x: 0, y: 0 },
  },
  {
    type: "schematic_text",
    schematic_text_id: "text",
    source_trace_id: "source",
    text: "PWR",
    schematic_sheet_id: "s1",
    position: { x: 2, y: 0.2 },
  },
] as CircuitJson

test("one destination per drawn island, with branches joined and crossings and sheets separate", () => {
  const locations = getNetLocations(fixture, "power")
  expect(locations).toHaveLength(3)
  expect(locations[0]?.label).toBe("Sheet 1: U1.PWR")
  expect(locations.filter((l) => l.schematicSheetId === "s3")).toHaveLength(1)
  expect(getNetLocations(fixture, "missing")).toEqual([])
})

test("explicit junction joins crossing segments", () => {
  const circuit = structuredClone(fixture)
  const crossing = circuit.find(
    (e) => e.type === "schematic_trace" && e.schematic_trace_id === "cross",
  )!
  if (crossing.type === "schematic_trace")
    crossing.junctions = [{ x: 0.5, y: 0 }]
  expect(getNetLocations(circuit, "power")).toHaveLength(2)
})

test("disconnected segments in the same trace remain separate destinations", () => {
  const a = trace("a", "s1", [0, 0], [1, 0])
  const b = trace("b", "s1", [10, 0], [11, 0])
  expect(
    getNetLocations(
      [{ ...a, edges: [...a.edges, ...b.edges] }] as CircuitJson,
      "power",
    ),
  ).toHaveLength(2)
})

test("trace, label, and associated text resolve the same net, unrelated text does not", () => {
  const dom = new JSDOM(
    `<svg><g data-subcircuit-connectivity-map-key="power"><path /></g><text data-schematic-net-label-id="label"/><text data-schematic-text-id="text"/><text data-schematic-text-id="other"/></svg>`,
  )
  try {
    for (const selector of [
      "path",
      "[data-schematic-net-label-id]",
      '[data-schematic-text-id="text"]',
    ])
      expect(
        getNetKeyAtElement(
          dom.window.document.querySelector(selector),
          fixture,
        ),
      ).toBe("power")
    expect(
      getNetKeyAtElement(
        dom.window.document.querySelector('[data-schematic-text-id="other"]'),
        fixture,
      ),
    ).toBeUndefined()
  } finally {
    dom.window.close()
  }
})

test("real board inline net text resolves to its two disconnected pin islands", async () => {
  const { default: board } = await import(
    "../examples/am3352-dev-board-4layer-dogbone.circuit.json"
  )
  const circuit = board as CircuitJson
  const text = circuit.find(
    (e) =>
      e.type === "schematic_text" &&
      e.schematic_text_id === "schematic_text_120",
  )!
  if (text.type !== "schematic_text") throw new Error("Missing text fixture")
  const trace = circuit
    .filter((e) => e.type === "source_trace")
    .find((e) => e.source_trace_id === text.source_trace_id)!
  expect(
    getNetLocations(circuit, trace.subcircuit_connectivity_map_key!).map(
      (l) => l.label,
    ),
  ).toEqual(["03-Interfaces: J_USB0.Data_NEG", "03-Interfaces: U1.N18"])
})
