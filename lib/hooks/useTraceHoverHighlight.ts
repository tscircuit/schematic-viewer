import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

const HIGHLIGHT_COLOR = "#60a5fa"

/**
 * This hook highlights traces on hover and all traces connected to the same net
 */
export const useTraceHoverHighlight = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const sourceTraces = su(circuitJson).source_trace.list()
    const schematicTraces = su(circuitJson).schematic_trace.list()

    if (schematicTraces.length === 0) return

    // Build schematic_trace_id → source_trace_id
    const schematicToSource = new Map<string, string>()
    for (const st of schematicTraces) {
      if (st.source_trace_id) {
        schematicToSource.set(st.schematic_trace_id, st.source_trace_id)
      }
    }

    // Build source_port_id → Set<source_trace_id>
    const portToSources = new Map<string, Set<string>>()
    for (const st of sourceTraces) {
      for (const portId of st.connected_source_port_ids ?? []) {
        if (!portToSources.has(portId)) portToSources.set(portId, new Set())
        portToSources.get(portId)!.add(st.source_trace_id)
      }
    }

    // Build source_trace_id → Set<schematic_trace_id>
    const sourceToSchematics = new Map<string, Set<string>>()
    for (const st of schematicTraces) {
      if (!st.source_trace_id) continue
      if (!sourceToSchematics.has(st.source_trace_id)) {
        sourceToSchematics.set(st.source_trace_id, new Set())
      }
      sourceToSchematics.get(st.source_trace_id)!.add(st.schematic_trace_id)
    }

    // Precompute net groups: traces sharing connected ports are on the same net
    const traceNetMap = new Map<string, number>()
    const netTraces = new Map<number, Set<string>>()
    let nextNetId = 0

    for (const st of schematicTraces) {
      if (traceNetMap.has(st.schematic_trace_id)) continue

      const visited = new Set<string>()
      const queue = [st.schematic_trace_id]

      while (queue.length > 0) {
        const currentSchId = queue.pop()!
        if (visited.has(currentSchId)) continue
        visited.add(currentSchId)

        const srcId = schematicToSource.get(currentSchId)
        if (!srcId) continue

        const srcTrace = sourceTraces.find((s) => s.source_trace_id === srcId)
        if (!srcTrace) continue

        for (const portId of srcTrace.connected_source_port_ids ?? []) {
          const connectedSrcIds = portToSources.get(portId)
          if (!connectedSrcIds) continue
          for (const connSrcId of connectedSrcIds) {
            const schIds = sourceToSchematics.get(connSrcId)
            if (!schIds) continue
            for (const schId of schIds) {
              if (!visited.has(schId)) queue.push(schId)
            }
          }
        }
      }

      const netId = nextNetId++
      netTraces.set(netId, visited)
      for (const id of visited) {
        traceNetMap.set(id, netId)
      }
    }

    // Hover state
    const originalStrokes = new Map<Element, string>()
    let currentNetId: number | null = null

    const clearHighlights = () => {
      for (const [el, stroke] of originalStrokes) {
        el.setAttribute("stroke", stroke)
      }
      originalStrokes.clear()
      currentNetId = null
    }

    const applyHighlights = (netId: number) => {
      const traceIds = netTraces.get(netId)
      if (!traceIds) return

      for (const traceId of traceIds) {
        const paths = svg.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"] path`,
        )
        for (const path of Array.from(paths)) {
          if (path.getAttribute("class")?.includes("invisible")) continue
          originalStrokes.set(path, path.getAttribute("stroke") || "")
          path.setAttribute("stroke", HIGHLIGHT_COLOR)
        }
      }
      currentNetId = netId
    }

    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as Element
      if (!target?.closest) return

      const traceGroup = target.closest("[data-schematic-trace-id]")
      if (!traceGroup) {
        if (currentNetId !== null) clearHighlights()
        return
      }

      const traceId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!traceId) {
        if (currentNetId !== null) clearHighlights()
        return
      }

      const netId = traceNetMap.get(traceId)
      if (netId === undefined) {
        if (currentNetId !== null) clearHighlights()
        return
      }

      // Already highlighting this net
      if (netId === currentNetId) return

      clearHighlights()
      applyHighlights(netId)
    }

    const handlePointerLeave = () => {
      clearHighlights()
    }

    svg.addEventListener("pointermove", handlePointerMove)
    svg.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      clearHighlights()
      svg.removeEventListener("pointermove", handlePointerMove)
      svg.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [svgDivRef, circuitJson])
}
