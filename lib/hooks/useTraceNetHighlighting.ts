import { useEffect, useMemo } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

/**
 * This hook highlights all traces in the same net when hovering over any trace.
 *
 * It builds a mapping from schematic_trace_id to a net group, then on mouseenter
 * of any trace element, applies a highlight class to all traces sharing the same net.
 */
export const useTraceNetHighlighting = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  // Build a mapping: schematic_trace_id -> net group id
  // Traces sharing connected_source_port_ids belong to the same net.
  const traceNetGroups = useMemo(() => {
    try {
      const sourceTraces = su(circuitJson).source_trace?.list() ?? []
      const schematicTraces = su(circuitJson).schematic_trace?.list() ?? []

      // Use Union-Find to group source ports into nets
      const parent: Record<string, string> = {}
      const find = (x: string): string => {
        if (!parent[x]) parent[x] = x
        if (parent[x] !== x) parent[x] = find(parent[x])
        return parent[x]
      }
      const union = (a: string, b: string) => {
        const ra = find(a)
        const rb = find(b)
        if (ra !== rb) parent[ra] = rb
      }

      // Union all ports connected by the same source_trace
      for (const st of sourceTraces) {
        const portIds = st.connected_source_port_ids ?? []
        for (let i = 1; i < portIds.length; i++) {
          union(portIds[0], portIds[i])
        }
      }

      // Map source_trace_id -> net root
      const sourceTraceToNet: Record<string, string> = {}
      for (const st of sourceTraces) {
        const portIds = st.connected_source_port_ids ?? []
        if (portIds.length > 0) {
          sourceTraceToNet[st.source_trace_id] = find(portIds[0])
        }
      }

      // Map schematic_trace_id -> net root
      const schematicTraceToNet: Record<string, string> = {}
      for (const st of schematicTraces) {
        const sourceTraceId = (st as any).source_trace_id
        if (sourceTraceId && sourceTraceToNet[sourceTraceId]) {
          schematicTraceToNet[st.schematic_trace_id] =
            sourceTraceToNet[sourceTraceId]
        }
      }

      // Build net group: net root -> list of schematic_trace_ids
      const netGroups: Record<string, string[]> = {}
      for (const [traceId, netId] of Object.entries(schematicTraceToNet)) {
        if (!netGroups[netId]) netGroups[netId] = []
        netGroups[netId].push(traceId)
      }

      return { schematicTraceToNet, netGroups }
    } catch (err) {
      console.error("Failed to build trace net groups", err)
      return { schematicTraceToNet: {}, netGroups: {} }
    }
  }, [circuitJson])

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const HIGHLIGHT_COLOR = "#60a5fa"

    const handleMouseEnter = (e: Event) => {
      const traceGroup = e.currentTarget as Element
      const traceId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!traceId) return

      const netId = traceNetGroups.schematicTraceToNet[traceId]
      if (!netId) return

      const siblingTraceIds = traceNetGroups.netGroups[netId] ?? []

      for (const siblingId of siblingTraceIds) {
        const el = svg.querySelector(`[data-schematic-trace-id="${siblingId}"]`)
        if (!el) continue
        // Highlight all visible path elements in this trace group
        const paths = el.querySelectorAll("path")
        for (const path of Array.from(paths)) {
          if (path.getAttribute("class")?.includes("invisible")) continue
          path.setAttribute(
            "data-original-stroke",
            path.getAttribute("stroke") || "",
          )
          path.setAttribute("stroke", HIGHLIGHT_COLOR)
        }
      }
    }

    const handleMouseLeave = (e: Event) => {
      const traceGroup = e.currentTarget as Element
      const traceId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!traceId) return

      const netId = traceNetGroups.schematicTraceToNet[traceId]
      if (!netId) return

      const siblingTraceIds = traceNetGroups.netGroups[netId] ?? []

      for (const siblingId of siblingTraceIds) {
        const el = svg.querySelector(`[data-schematic-trace-id="${siblingId}"]`)
        if (!el) continue
        const paths = el.querySelectorAll("path")
        for (const path of Array.from(paths)) {
          if (path.getAttribute("class")?.includes("invisible")) continue
          const original = path.getAttribute("data-original-stroke")
          if (original !== null) {
            path.setAttribute("stroke", original)
            path.removeAttribute("data-original-stroke")
          }
        }
      }
    }

    const attachListeners = () => {
      const traceGroups = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"]',
      )
      for (const group of Array.from(traceGroups)) {
        group.addEventListener("mouseenter", handleMouseEnter)
        group.addEventListener("mouseleave", handleMouseLeave)
      }
      return traceGroups
    }

    const traceGroups = attachListeners()

    // Watch for SVG content changes (e.g., re-renders)
    const observer = new MutationObserver(() => {
      // Reattach on DOM changes
      for (const group of Array.from(traceGroups)) {
        group.removeEventListener("mouseenter", handleMouseEnter)
        group.removeEventListener("mouseleave", handleMouseLeave)
      }
      attachListeners()
    })
    observer.observe(svg, { childList: true, subtree: false })

    return () => {
      observer.disconnect()
      const allTraceGroups = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"]',
      )
      for (const group of Array.from(allTraceGroups)) {
        group.removeEventListener("mouseenter", handleMouseEnter)
        group.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [svgDivRef, traceNetGroups])
}
