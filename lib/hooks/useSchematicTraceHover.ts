import { useEffect } from "react"
import type { CircuitJson } from "circuit-json"

interface UseSchematicTraceHoverOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}

const HOVER_CLASS = "schematic-trace-hover-highlight"
const DIM_CLASS = "schematic-trace-hover-dim"

/**
 * Builds a map from schematic_trace_id → net group key.
 *
 * Priority order:
 * 1. subcircuit_connectivity_map_key already on the trace
 * 2. Derived from source_port connectivity keys via schematic_port → source_port chain
 * 3. Geometric adjacency fallback (shared endpoints between traces)
 */
function buildTraceGroupMap(circuitJson: CircuitJson): Map<string, string> {
  const traceGroupMap = new Map<string, string>()

  // Index source_ports by id
  const sourcePortById = new Map<string, any>()
  for (const el of circuitJson as any[]) {
    if (el.type === "source_port" && el.source_port_id) {
      sourcePortById.set(el.source_port_id, el)
    }
  }

  // Index schematic_ports by id, map to source_port
  const schematicPortById = new Map<string, any>()
  for (const el of circuitJson as any[]) {
    if (el.type === "schematic_port" && el.schematic_port_id) {
      schematicPortById.set(el.schematic_port_id, el)
    }
  }

  // Build port center → net key map from source_port connectivity keys
  const portCenterToNetKey = new Map<string, string>()
  for (const schPort of schematicPortById.values()) {
    const srcPort = sourcePortById.get(schPort.source_port_id)
    const netKey =
      srcPort?.subcircuit_connectivity_map_key ??
      srcPort?.net_id ??
      srcPort?.source_net_id
    if (netKey && schPort.center) {
      const key = `${schPort.center.x},${schPort.center.y}`
      portCenterToNetKey.set(key, netKey)
    }
  }

  // Index source_traces by id for connectivity key lookup
  const sourceTraceByConnKey = new Map<string, string>()
  for (const el of circuitJson as any[]) {
    if (el.type === "source_trace" && el.subcircuit_connectivity_map_key) {
      sourceTraceByConnKey.set(
        el.source_trace_id,
        el.subcircuit_connectivity_map_key,
      )
    }
  }

  // Collect all schematic traces
  const schematicTraces: any[] = []
  for (const el of circuitJson as any[]) {
    if (el.type === "schematic_trace" && el.schematic_trace_id) {
      schematicTraces.push(el)
    }
  }

  // Assign net keys to traces
  for (const trace of schematicTraces) {
    const id = trace.schematic_trace_id

    // 1. Already has a connectivity key
    if (trace.subcircuit_connectivity_map_key) {
      traceGroupMap.set(id, trace.subcircuit_connectivity_map_key)
      continue
    }

    // 2. Derive from port centers
    let netKey: string | undefined
    const allPoints: Array<{ x: number; y: number }> = []
    for (const edge of trace.edges ?? []) {
      if (edge.from) allPoints.push(edge.from)
      if (edge.to) allPoints.push(edge.to)
    }
    for (const pt of allPoints) {
      const k = `${pt.x},${pt.y}`
      if (portCenterToNetKey.has(k)) {
        netKey = portCenterToNetKey.get(k)
        break
      }
    }

    if (netKey) {
      traceGroupMap.set(id, netKey)
    }
  }

  // 3. Geometric adjacency fallback: union-find for traces sharing endpoints
  // Build endpoint → trace IDs map
  const endpointToTraces = new Map<string, string[]>()
  for (const trace of schematicTraces) {
    const id = trace.schematic_trace_id
    const points = new Set<string>()
    for (const edge of trace.edges ?? []) {
      if (edge.from) points.add(`${edge.from.x},${edge.from.y}`)
      if (edge.to) points.add(`${edge.to.x},${edge.to.y}`)
    }
    for (const junction of trace.junctions ?? []) {
      points.add(`${junction.x},${junction.y}`)
    }
    for (const pt of points) {
      if (!endpointToTraces.has(pt)) endpointToTraces.set(pt, [])
      endpointToTraces.get(pt)!.push(id)
    }
  }

  // Union-find
  const parent = new Map<string, string>()
  const find = (x: string): string => {
    if (!parent.has(x)) parent.set(x, x)
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!))
    return parent.get(x)!
  }
  const union = (a: string, b: string) => {
    parent.set(find(a), find(b))
  }

  for (const traces of endpointToTraces.values()) {
    for (let i = 1; i < traces.length; i++) {
      union(traces[0], traces[i])
    }
  }

  // Assign fallback group keys to traces without a net key
  for (const trace of schematicTraces) {
    const id = trace.schematic_trace_id
    if (!traceGroupMap.has(id)) {
      const root = find(id)
      traceGroupMap.set(id, `schematic_trace_group_${root}`)
    }
  }

  return traceGroupMap
}

export const useSchematicTraceHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: UseSchematicTraceHoverOptions) => {
  useEffect(() => {
    const container = svgDivRef.current
    if (!container) return

    const traceGroupMap = buildTraceGroupMap(circuitJson)

    // Build reverse map: groupKey → [traceId, ...]
    const groupToTraces = new Map<string, string[]>()
    for (const [traceId, groupKey] of traceGroupMap) {
      if (!groupToTraces.has(groupKey)) groupToTraces.set(groupKey, [])
      groupToTraces.get(groupKey)!.push(traceId)
    }

    const svg = container.querySelector("svg")
    if (!svg) return

    // Inject hover CSS once
    const styleId = "schematic-trace-hover-style"
    if (!svg.querySelector(`#${styleId}`)) {
      const style = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "style",
      )
      style.id = styleId
      style.textContent = `
        .${HOVER_CLASS} path,
        .${HOVER_CLASS} line,
        .${HOVER_CLASS} polyline,
        .${HOVER_CLASS} circle {
          stroke: #f5a623 !important;
          stroke-width: 2.5 !important;
          filter: drop-shadow(0 0 3px rgba(245, 166, 35, 0.6));
        }
        .${DIM_CLASS} {
          opacity: 0.3;
        }
      `
      svg.insertBefore(style, svg.firstChild)
    }

    const cleanups: Array<() => void> = []

    for (const [traceId, groupKey] of traceGroupMap) {
      const el = svg.querySelector(
        `[data-schematic-trace-id="${traceId}"]`,
      ) as SVGElement | null
      if (!el) continue

      el.style.cursor = "pointer"

      const siblingIds = groupToTraces.get(groupKey) ?? []

      const onEnter = () => {
        // Highlight all traces in the same group
        for (const sid of siblingIds) {
          const sibling = svg.querySelector(
            `[data-schematic-trace-id="${sid}"]`,
          )
          sibling?.classList.add(HOVER_CLASS)
        }
        // Dim all traces NOT in this group
        for (const [otherId, otherGroup] of traceGroupMap) {
          if (otherGroup !== groupKey) {
            const other = svg.querySelector(
              `[data-schematic-trace-id="${otherId}"]`,
            )
            other?.classList.add(DIM_CLASS)
          }
        }
      }

      const onLeave = () => {
        for (const sid of siblingIds) {
          const sibling = svg.querySelector(
            `[data-schematic-trace-id="${sid}"]`,
          )
          sibling?.classList.remove(HOVER_CLASS)
        }
        for (const [otherId] of traceGroupMap) {
          const other = svg.querySelector(
            `[data-schematic-trace-id="${otherId}"]`,
          )
          other?.classList.remove(DIM_CLASS)
        }
      }

      el.addEventListener("mouseenter", onEnter)
      el.addEventListener("mouseleave", onLeave)
      cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter)
        el.removeEventListener("mouseleave", onLeave)
        el.style.cursor = ""
      })
    }

    return () => {
      for (const cleanup of cleanups) cleanup()
      // Remove injected style
      svg.querySelector(`#${styleId}`)?.remove()
      // Remove any lingering classes
      for (const el of svg.querySelectorAll(
        `.${HOVER_CLASS}, .${DIM_CLASS}`,
      )) {
        el.classList.remove(HOVER_CLASS, DIM_CLASS)
      }
    }
  }, [svgDivRef, circuitJsonKey, circuitJson])
}
