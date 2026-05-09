import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo } from "react"

const HIGHLIGHT_COLOR = "#1e90ff"

interface NetGroupData {
  /** Map from schematic_trace_id to its net group (set of all trace ids in the net) */
  traceToGroup: Map<string, Set<string>>
  /** Map from schematic_trace_id to a stable group key (for quick equality checks) */
  traceToGroupKey: Map<string, string>
}

/**
 * Groups traces into nets using two strategies:
 *
 * 1. If `subcircuit_connectivity_map_key` is present on the schematic traces,
 *    traces sharing the same key belong to the same net.
 *
 * 2. If the key is absent, we fall back to the circuit-json graph: walk from
 *    each `schematic_trace` to its `source_trace`, collect the
 *    `connected_source_port_ids`, and use BFS to group all `source_trace`s
 *    that share at least one port (i.e. they are on the same net).
 */
function buildNetGroups(circuitJson: CircuitJson): NetGroupData {
  const soup = su(circuitJson)
  const schematicTraces = soup.schematic_trace?.list() ?? []
  const sourceTraces = soup.source_trace?.list() ?? []

  // Map source_trace_id -> source_trace for quick lookup
  const sourceTraceById = new Map<string, any>()
  for (const st of sourceTraces) {
    sourceTraceById.set(st.source_trace_id, st)
  }

  // Map schematic_trace_id -> source_trace_id
  const schToSrc = new Map<string, string>()
  for (const st of schematicTraces) {
    if (st.source_trace_id) {
      schToSrc.set(st.schematic_trace_id, st.source_trace_id)
    }
  }

  // Strategy 1: group by subcircuit_connectivity_map_key
  const keyGroups = new Map<string, Set<string>>()
  const ungrouped: string[] = []

  for (const st of schematicTraces) {
    const key = (st as any).subcircuit_connectivity_map_key as
      | string
      | undefined
    if (key) {
      if (!keyGroups.has(key)) keyGroups.set(key, new Set())
      keyGroups.get(key)!.add(st.schematic_trace_id)
    } else {
      ungrouped.push(st.schematic_trace_id)
    }
  }

  // Strategy 2: BFS over shared ports for ungrouped traces
  // Build port -> source_trace_id adjacency
  const portToSourceTraces = new Map<string, Set<string>>()
  for (const st of sourceTraces) {
    for (const portId of st.connected_source_port_ids ?? []) {
      if (!portToSourceTraces.has(portId))
        portToSourceTraces.set(portId, new Set())
      portToSourceTraces.get(portId)!.add(st.source_trace_id)
    }
  }

  // Build source_trace_id -> set of schematic_trace_ids
  const srcToSch = new Map<string, Set<string>>()
  for (const [schId, srcId] of schToSrc) {
    if (!srcToSch.has(srcId)) srcToSch.set(srcId, new Set())
    srcToSch.get(srcId)!.add(schId)
  }

  // BFS: given a source_trace, find all source_traces connected via shared ports
  const visited = new Set<string>()
  const bfsGroups: Set<string>[] = []

  for (const schTraceId of ungrouped) {
    const srcId = schToSrc.get(schTraceId)
    if (!srcId || visited.has(srcId)) continue

    const group = new Set<string>()
    const queue = [srcId]
    visited.add(srcId)

    while (queue.length > 0) {
      const current = queue.shift()!
      const srcTrace = sourceTraceById.get(current)
      if (!srcTrace) continue

      // Add all schematic traces for this source trace
      const schIds = srcToSch.get(current)
      if (schIds) {
        for (const id of schIds) group.add(id)
      }

      // Find neighboring source traces via shared ports
      for (const portId of srcTrace.connected_source_port_ids ?? []) {
        const neighbors = portToSourceTraces.get(portId)
        if (!neighbors) continue
        for (const neighborSrcId of neighbors) {
          if (!visited.has(neighborSrcId)) {
            visited.add(neighborSrcId)
            queue.push(neighborSrcId)
          }
        }
      }
    }

    if (group.size > 0) bfsGroups.push(group)
  }

  // Merge results into final maps
  const traceToGroup = new Map<string, Set<string>>()
  const traceToGroupKey = new Map<string, string>()

  let groupIdx = 0
  const assignGroup = (group: Set<string>, key: string) => {
    for (const id of group) {
      traceToGroup.set(id, group)
      traceToGroupKey.set(id, key)
    }
  }

  for (const [key, group] of keyGroups) {
    assignGroup(group, `key:${key}`)
  }
  for (const group of bfsGroups) {
    assignGroup(group, `bfs:${groupIdx++}`)
  }

  // Traces without any group get a singleton
  for (const st of schematicTraces) {
    if (!traceToGroup.has(st.schematic_trace_id)) {
      const singleton = new Set([st.schematic_trace_id])
      traceToGroup.set(st.schematic_trace_id, singleton)
      traceToGroupKey.set(
        st.schematic_trace_id,
        `single:${st.schematic_trace_id}`,
      )
    }
  }

  return { traceToGroup, traceToGroupKey }
}

/**
 * Highlights all traces in the same net on hover.
 *
 * When the pointer enters a schematic trace, every trace sharing the same net
 * changes stroke color to a highlight blue. When the pointer leaves, original
 * colors are restored. Moving between traces in the same net does not flicker.
 */
export const useTraceHoverHighlight = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  const netGroupData = useMemo(() => buildNetGroups(circuitJson), [circuitJson])

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const originalStrokes = new Map<Element, string>()
    let currentGroupKey: string | null = null

    const clearHighlights = () => {
      for (const [el, stroke] of originalStrokes) {
        el.setAttribute("stroke", stroke)
      }
      originalStrokes.clear()
      currentGroupKey = null
    }

    const highlightTraces = (schematicTraceIds: Set<string>) => {
      for (const traceId of schematicTraceIds) {
        // Select paths from both base trace and overlay groups
        const paths = svg.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"] path`,
        )
        for (const path of Array.from(paths)) {
          if (path.getAttribute("class")?.includes("invisible")) continue
          if (!originalStrokes.has(path)) {
            originalStrokes.set(path, path.getAttribute("stroke") || "")
          }
          path.setAttribute("stroke", HIGHLIGHT_COLOR)
        }
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as Element
      if (!target?.closest) return

      const traceGroup = target.closest(
        '[data-circuit-json-type="schematic_trace"]',
      )

      if (!traceGroup) {
        if (currentGroupKey !== null) clearHighlights()
        return
      }

      const traceId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!traceId) {
        if (currentGroupKey !== null) clearHighlights()
        return
      }

      const groupKey = netGroupData.traceToGroupKey.get(traceId)
      if (!groupKey) return

      // Already highlighting this net group -- skip to avoid flicker
      if (currentGroupKey === groupKey) return

      clearHighlights()

      const group = netGroupData.traceToGroup.get(traceId)
      if (group) {
        highlightTraces(group)
        currentGroupKey = groupKey
      }
    }

    const handlePointerLeave = () => {
      clearHighlights()
    }

    // Inject a <style> inside the SVG element that disables the default
    // per-trace and per-net :hover rules from circuit-to-svg, so we don't
    // get double highlighting (our JS-based approach replaces those rules).
    const styleId = "trace-hover-highlight-override"
    const svgEl = svg.querySelector("svg")
    const styleTarget = svgEl ?? svg
    let style = styleTarget.querySelector(
      `#${styleId}`,
    ) as HTMLStyleElement | null
    if (!style) {
      style = document.createElement("style")
      style.id = styleId
      // Disable the basic .trace:hover and the :has()-based net hover rules
      style.textContent = `
        .trace:hover { filter: none !important; }
        .trace:hover .trace-junction { filter: none !important; }
        svg:has(.trace:hover) .trace { filter: none !important; }
        svg:has(.trace-overlays:hover) .trace { filter: none !important; }
        svg:has(.trace:hover) .trace-overlays { filter: none !important; }
        svg:has(.trace-overlays:hover) .trace-overlays { filter: none !important; }
        svg:has(.trace:hover) .trace-overlays .trace-crossing-outline { opacity: 1 !important; }
        svg:has(.trace-overlays:hover) .trace-overlays .trace-crossing-outline { opacity: 1 !important; }
      `
      styleTarget.appendChild(style)
    }

    svg.addEventListener("pointermove", handlePointerMove)
    svg.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      clearHighlights()
      svg.removeEventListener("pointermove", handlePointerMove)
      svg.removeEventListener("pointerleave", handlePointerLeave)
      // Remove the override style
      const s = styleTarget.querySelector(`#${styleId}`)
      if (s) s.remove()
    }
  }, [svgDivRef, circuitJson, netGroupData])
}
