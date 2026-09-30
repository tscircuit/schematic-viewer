import type { CircuitJson } from "circuit-json"
import type { SchematicSearchResult } from "./get-schematic-search-results"
import { buildNetRegistry } from "./schematic-net-registry"

type Point = { x: number; y: number }
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const distanceToSegment = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x,
    dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared
    ? Math.max(
        0,
        Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared),
      )
    : 0
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy })
}
const onSegment = (p: Point, a: Point, b: Point) =>
  Math.abs(distance(a, p) + distance(p, b) - distance(a, b)) < 0.00001

export function getNetKeyAtElement(
  target: Element | null,
  circuitJson: CircuitJson,
) {
  const registry = buildNetRegistry(circuitJson)
  const element = target?.closest(
    "[data-subcircuit-connectivity-map-key], [data-schematic-net-label-id], [data-schematic-text-id], [data-schematic-trace-id]",
  )
  if (!element) return undefined
  const trace = circuitJson.find(
    (e) =>
      e.type === "schematic_trace" &&
      e.schematic_trace_id === element.getAttribute("data-schematic-trace-id"),
  )
  return (
    element.getAttribute("data-subcircuit-connectivity-map-key") ||
    registry.netLabelIdToKey.get(
      element.getAttribute("data-schematic-net-label-id")!,
    ) ||
    registry.textIdToKey.get(element.getAttribute("data-schematic-text-id")!) ||
    (trace?.type === "schematic_trace"
      ? trace.subcircuit_connectivity_map_key ||
        circuitJson
          .filter((e) => e.type === "source_trace")
          .find((e) => e.source_trace_id === trace.source_trace_id)
          ?.subcircuit_connectivity_map_key
      : undefined)
  )
}

/** Physical islands, not logical-net groups. Crossings without endpoints or
 * explicit junctions do not join wires; sheet coordinates are independent. */
export function getNetLocations(
  circuitJson: CircuitJson,
  key: string,
): SchematicSearchResult[] {
  const registry = buildNetRegistry(circuitJson)
  const sources = circuitJson.filter((e) => e.type === "source_trace")
  const traces = circuitJson.filter((e) => e.type === "schematic_trace")
  const sheets = circuitJson.filter((e) => e.type === "schematic_sheet")
  const defaultSheet = sheets[0]?.schematic_sheet_id
  type Node = {
    a: Point
    b: Point
    sheet?: string
    target: SchematicSearchResult["target"]
    name?: string
    sourceTraceId?: string
    portIds?: string[]
    junctions?: Point[]
  }
  const nodes: Node[] = []
  for (const trace of traces) {
    const traceKey =
      trace.subcircuit_connectivity_map_key ??
      sources.find((s) => s.source_trace_id === trace.source_trace_id)
        ?.subcircuit_connectivity_map_key
    if (traceKey !== key) continue
    for (const edge of trace.edges)
      nodes.push({
        a: edge.from,
        b: edge.to,
        sheet: trace.schematic_sheet_id ?? defaultSheet,
        target: { type: "schematic_trace", id: trace.schematic_trace_id },
        sourceTraceId: trace.source_trace_id,
        portIds: [
          edge.from_schematic_port_id,
          edge.to_schematic_port_id,
        ].filter((id): id is string => !!id),
        junctions: trace.junctions,
      })
  }
  for (const element of circuitJson) {
    if (
      element.type === "schematic_net_label" &&
      registry.netLabelIdToKey.get(element.schematic_net_label_id) === key
    ) {
      const point = element.anchor_position ?? element.center
      nodes.push({
        a: point,
        b: point,
        sheet: element.schematic_sheet_id ?? defaultSheet,
        target: {
          type: "schematic_net_label",
          id: element.schematic_net_label_id,
        },
        name: element.text,
      })
    }
  }
  // Trace annotations can be offset from the wire. Attach each to the nearest
  // segment of its own source trace on the same sheet, not to every occurrence.
  for (const element of circuitJson) {
    if (
      element.type !== "schematic_text" ||
      registry.textIdToKey.get(element.schematic_text_id) !== key
    )
      continue
    const sheet = element.schematic_sheet_id ?? defaultSheet
    const nearest = nodes
      .filter(
        (n) => n.sheet === sheet && n.sourceTraceId === element.source_trace_id,
      )
      .sort(
        (a, b) =>
          distanceToSegment(element.position, a.a, a.b) -
          distanceToSegment(element.position, b.a, b.b),
      )[0]
    const point = nearest?.a ?? element.position
    nodes.push({
      a: point,
      b: point,
      sheet,
      target: { type: "schematic_text", id: element.schematic_text_id },
      name: element.text,
    })
  }
  const parents = nodes.map((_, i) => i)
  const root = (i: number): number =>
    parents[i] === i ? i : (parents[i] = root(parents[i]))
  for (let i = 0; i < nodes.length; i++)
    for (let j = 0; j < i; j++) {
      const a = nodes[i]!,
        b = nodes[j]!
      if (a.sheet !== b.sheet) continue
      if (
        onSegment(a.a, b.a, b.b) ||
        onSegment(a.b, b.a, b.b) ||
        onSegment(b.a, a.a, a.b) ||
        onSegment(b.b, a.a, a.b) ||
        [...(a.junctions ?? []), ...(b.junctions ?? [])].some(
          (p) => onSegment(p, a.a, a.b) && onSegment(p, b.a, b.b),
        )
      )
        parents[root(i)] = root(j)
    }
  const groups = new Map<number, Node[]>()
  nodes.forEach((node, i) =>
    groups.set(root(i), [...(groups.get(root(i)) ?? []), node]),
  )
  return [...groups.values()].map((island, index) => {
    const representative =
      island.find((n) => n.target.type !== "schematic_trace") ?? island[0]!
    const ports = circuitJson
      .filter((e) => e.type === "schematic_port")
      .filter(
        (e) =>
          (e.schematic_sheet_id ?? defaultSheet) === representative.sheet &&
          island.some(
            (n) =>
              n.portIds?.includes(e.schematic_port_id) ||
              onSegment(e.center, n.a, n.b),
          ),
      )
    const names = ports
      .map((port) => {
        const sourcePort = circuitJson.find(
          (e) =>
            e.type === "source_port" &&
            e.source_port_id === port.source_port_id,
        )
        if (sourcePort?.type !== "source_port") return undefined
        const component = circuitJson.find(
          (e) =>
            e.type === "source_component" &&
            e.source_component_id === sourcePort.source_component_id,
        )
        return component?.type === "source_component"
          ? `${component.name}.${sourcePort.name ?? `pin${sourcePort.pin_number}`}`
          : undefined
      })
      .filter((name): name is string => !!name)
      .sort()
    const sheetIndex = sheets.findIndex(
      (s) => s.schematic_sheet_id === representative.sheet,
    )
    const sheetName =
      sheets[sheetIndex]?.name ?? `Sheet ${Math.max(0, sheetIndex) + 1}`
    return {
      kind: "net",
      label: `${sheetName}: ${names[0] ?? representative.name ?? `Location ${index + 1}`}`,
      schematicSheetId: representative.sheet,
      target: representative.target,
      focusPoint: {
        x: (representative.a.x + representative.b.x) / 2,
        y: (representative.a.y + representative.b.y) / 2,
      },
    }
  })
}
