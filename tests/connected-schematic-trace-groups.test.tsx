import { describe, expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"
import {
  addConnectivityKeysToSchematicTraces,
  getConnectedSchematicTraceGroups,
  getSchematicTraceGroupKeys,
} from "../lib/utils/getConnectedSchematicTraceGroups"

describe("getConnectedSchematicTraceGroups", () => {
  test("copies source-port connectivity keys onto rendered schematic traces", () => {
    const circuitJson = renderToCircuitJson(
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance={1000} schX={-2} />
        <capacitor name="C1" capacitance="1uF" schX={2} />
        <trace from=".R1 .pin2" to=".C1 .pin1" />
      </board>,
    )

    const augmentedCircuitJson =
      addConnectivityKeysToSchematicTraces(circuitJson)
    const schematicTrace = augmentedCircuitJson.find(
      (entry: any) => entry.type === "schematic_trace",
    ) as any
    const sourceTrace = augmentedCircuitJson.find(
      (entry: any) => entry.type === "source_trace",
    ) as any

    expect(schematicTrace.subcircuit_connectivity_map_key).toBe(
      sourceTrace.subcircuit_connectivity_map_key,
    )
  })

  test("groups chain-connected trace segments under the same source net key", () => {
    const circuitJson = [
      {
        type: "source_port",
        source_port_id: "source_port_0",
        subcircuit_connectivity_map_key: "net_a",
      },
      {
        type: "source_port",
        source_port_id: "source_port_1",
        subcircuit_connectivity_map_key: "net_a",
      },
      {
        type: "schematic_port",
        schematic_port_id: "schematic_port_0",
        source_port_id: "source_port_0",
        center: { x: 0, y: 0 },
      },
      {
        type: "schematic_port",
        schematic_port_id: "schematic_port_1",
        source_port_id: "source_port_1",
        center: { x: 3, y: 0 },
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "trace_0",
        edges: [{ from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }],
        junctions: [{ x: 1, y: 0 }],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "trace_1",
        edges: [{ from: { x: 1, y: 0 }, to: { x: 2, y: 0 } }],
        junctions: [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "trace_2",
        edges: [{ from: { x: 2, y: 0 }, to: { x: 3, y: 0 } }],
        junctions: [{ x: 2, y: 0 }],
      },
    ] as CircuitJson

    expect(getSchematicTraceGroupKeys(circuitJson)).toEqual({
      trace_0: "net_a",
      trace_1: "net_a",
      trace_2: "net_a",
    })

    expect(getConnectedSchematicTraceGroups(circuitJson)).toEqual({
      trace_0: ["trace_0", "trace_1", "trace_2"],
      trace_1: ["trace_0", "trace_1", "trace_2"],
      trace_2: ["trace_0", "trace_1", "trace_2"],
    })
  })

  test("groups disconnected trace segments that share the same port net key", () => {
    const circuitJson = [
      {
        type: "source_port",
        source_port_id: "source_port_0",
        subcircuit_connectivity_map_key: "net_b",
      },
      {
        type: "source_port",
        source_port_id: "source_port_1",
        subcircuit_connectivity_map_key: "net_b",
      },
      {
        type: "schematic_port",
        schematic_port_id: "schematic_port_0",
        source_port_id: "source_port_0",
        center: { x: 0, y: 0 },
      },
      {
        type: "schematic_port",
        schematic_port_id: "schematic_port_1",
        source_port_id: "source_port_1",
        center: { x: 10, y: 0 },
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "trace_0",
        edges: [{ from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }],
        junctions: [],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "trace_1",
        edges: [{ from: { x: 10, y: 0 }, to: { x: 11, y: 0 } }],
        junctions: [],
      },
    ] as CircuitJson

    expect(getSchematicTraceGroupKeys(circuitJson)).toEqual({
      trace_0: "net_b",
      trace_1: "net_b",
    })

    expect(getConnectedSchematicTraceGroups(circuitJson)).toEqual({
      trace_0: ["trace_0", "trace_1"],
      trace_1: ["trace_0", "trace_1"],
    })
  })

  test("falls back to geometric grouping when net metadata is missing", () => {
    const circuitJson = [
      {
        type: "schematic_trace",
        schematic_trace_id: "trace_0",
        edges: [{ from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }],
        junctions: [{ x: 1, y: 0 }],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "trace_1",
        edges: [{ from: { x: 1, y: 0 }, to: { x: 2, y: 0 } }],
        junctions: [{ x: 1, y: 0 }],
      },
      {
        type: "schematic_trace",
        schematic_trace_id: "trace_2",
        edges: [{ from: { x: 10, y: 0 }, to: { x: 11, y: 0 } }],
        junctions: [],
      },
    ] as CircuitJson

    const groupKeys = getSchematicTraceGroupKeys(circuitJson)

    expect(groupKeys.trace_0).toBe(groupKeys.trace_1)
    expect(groupKeys.trace_0).toMatch(/^schematic_trace_group_/)
    expect(groupKeys.trace_2).not.toBe(groupKeys.trace_0)
  })
})
