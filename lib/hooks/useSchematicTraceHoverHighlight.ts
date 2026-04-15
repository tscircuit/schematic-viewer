import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

/**
 * Highlights all schematic traces belonging to the same electrical net
 * whenever the user hovers over any trace segment.
 *
 * Strategy:
 *   1. Build a net-group map from circuitJson:
 *        schematic_trace_id → Set<schematic_trace_id> (all traces on same net)
 *      using union-find over shared source-port IDs across source_traces.
 *   2. Attach mouseover/mouseout listeners to the rendered SVG div.
 *   3. On hover, look up the hovered trace’s group and paint all group members
 *      with HOVER_COLOR; restore original strokes on mouseout.
 */
export const useSchematicTraceHoverHighlight = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  useEffect(() => {
    const svgEl = svgDivRef.current
    if (!svgEl) return

    // --- Build net-group map ---
    const traceNetGroupMap = new Map<string, Set<string>>()

    try {
      const schematicTraces = su(circuitJson).schematic_trace?.list() ?? []
      const sourceTraces = su(circuitJson).source_trace?.list() ?? []

      // Union-Find helpers to merge source_traces that share a port
      const parent = new Map<string, string>()
      const getRoot = (id: string): string => {
        if (!parent.has(id)) return id
        const root = getRoot(parent.get(id)!)
        parent.set(id, root)
        return root
      }
      const union = (a: string, b: string) => {
        const ra = getRoot(a)
        const rb = getRoot(b)
        if (ra !== rb) parent.set(ra, rb)
      }

      // Group source_traces that share a connected port (same net)
      const portToSourceTraces = new Map<string, string[]>()
      for (const st of sourceTraces) {
        for (const portId of (st as any).connected_source_port_ids ?? []) {
          const arr = portToSourceTraces.get(portId) ?? []
          arr.push((st as any).source_trace_id)
          portToSourceTraces.set(portId, arr)
        }
      }
      for (const [, traceIds] of portToSourceTraces) {
        for (let i = 1; i < traceIds.length; i++) {
          union(traceIds[0], traceIds[i])
        }
      }

      // Map source_trace root → set of schematic_trace_ids
      const netGroups = new Map<string, Set<string>>()
      for (const st of schematicTraces) {
        const sourceTraceId = (st as any).source_trace_id
        if (!sourceTraceId) continue
        const root = getRoot(sourceTraceId)
        const group = netGroups.get(root) ?? new Set<string>()
        group.add((st as any).schematic_trace_id)
        netGroups.set(root, group)
      }

      // Build reverse lookup: schematic_trace_id → its net group
      for (const group of netGroups.values()) {
        for (const id of group) {
          traceNetGroupMap.set(id, group)
        }
      }
    } catch (_) {
      // Parsing failed — hover will still work for individual traces
    }

    // --- DOM interaction ---
    const HOVER_COLOR = "#f5a623"
    const savedStrokes = new Map<Element, string>()
    let activeGroup: Set<string> | null = null

    const applyHighlight = (group: Set<string>) => {
      if (activeGroup === group) return
      clearHighlight()
      activeGroup = group
      for (const traceId of group) {
        const paths = svgEl.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"] path,` +
            `[data-schematic-trace-id="${traceId}"] line`,
        )
        for (const path of Array.from(paths)) {
          const el = path as Element
          if (el.getAttribute("class")?.includes("invisible")) continue
          const orig = el.getAttribute("stroke") ?? ""
          savedStrokes.set(el, orig)
          el.setAttribute("stroke", HOVER_COLOR)
        }
      }
    }

    const clearHighlight = () => {
      for (const [el, color] of savedStrokes) {
        el.setAttribute("stroke", color)
      }
      savedStrokes.clear()
      activeGroup = null
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element
      const traceEl = target.closest("[data-schematic-trace-id]")
      if (!traceEl) return
      const traceId = traceEl.getAttribute("data-schematic-trace-id")
      if (!traceId) return
      // Fall back to a single-trace group if net mapping is unavailable
      const group = traceNetGroupMap.get(traceId) ?? new Set([traceId])
      applyHighlight(group)
    }

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as Element | null
      if (related?.closest("[data-schematic-trace-id]")) return
      clearHighlight()
    }

    svgEl.addEventListener("mouseover", handleMouseOver)
    svgEl.addEventListener("mouseout", handleMouseOut)

    return () => {
      svgEl.removeEventListener("mouseover", handleMouseOver)
      svgEl.removeEventListener("mouseout", handleMouseOut)
      clearHighlight()
    }
  }, [circuitJsonKey, svgDivRef])
}
