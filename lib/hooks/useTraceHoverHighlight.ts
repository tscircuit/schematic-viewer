import { useEffect, useRef, useCallback } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

/**
 * This hook highlights all traces on the same net when hovering over a trace
 */
export const useTraceHoverHighlight = ({
  svgDivRef,
  circuitJson,
  enabled = true,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  enabled?: boolean
}) => {
  // Cache for net groups: source_trace_id -> Set of schematic_trace_ids
  const netGroupsRef = useRef<Map<string, Set<string>> | null>(null)
  // Track currently hovered trace
  const hoveredTraceRef = useRef<string | null>(null)

  // Build net groups from circuit JSON
  useEffect(() => {
    if (!circuitJson || !enabled) return

    const netGroups = new Map<string, Set<string>>()
    const sourceTraces = su(circuitJson).source_trace.list()
    const schematicTraces = su(circuitJson).schematic_trace.list()

    // Build a map of source_port_id -> source_trace_ids
    const portToTraceMap = new Map<string, Set<string>>()
    for (const sourceTrace of sourceTraces) {
      const traceId = sourceTrace.source_trace_id
      for (const portId of sourceTrace.connected_source_port_ids || []) {
        if (!portToTraceMap.has(portId)) {
          portToTraceMap.set(portId, new Set())
        }
        portToTraceMap.get(portId)!.add(traceId)
      }
    }

    // For each source trace, find all connected schematic traces
    for (const sourceTrace of sourceTraces) {
      const sourceTraceId = sourceTrace.source_trace_id
      const connectedSchematicTraces = new Set<string>()

      // Find all source traces connected through shared ports
      const visitedSourceTraces = new Set<string>()
      const queue = [sourceTraceId]

      while (queue.length > 0) {
        const currentTraceId = queue.shift()!
        if (visitedSourceTraces.has(currentTraceId)) continue
        visitedSourceTraces.add(currentTraceId)

        const currentTrace = sourceTraces.find(
          (st) => st.source_trace_id === currentTraceId,
        )
        if (!currentTrace) continue

        // Find all source traces sharing any port with current trace
        for (const portId of currentTrace.connected_source_port_ids || []) {
          const connectedTraces = portToTraceMap.get(portId)
          if (connectedTraces) {
            for (const connectedTraceId of connectedTraces) {
              if (!visitedSourceTraces.has(connectedTraceId)) {
                queue.push(connectedTraceId)
              }
            }
          }
        }
      }

      // Find all schematic traces for these source traces
      for (const stId of visitedSourceTraces) {
        const relatedSchematicTraces = schematicTraces.filter(
          (schTrace) => schTrace.source_trace_id === stId,
        )
        for (const schTrace of relatedSchematicTraces) {
          connectedSchematicTraces.add(schTrace.schematic_trace_id)
        }
      }

      netGroups.set(sourceTraceId, connectedSchematicTraces)
    }

    netGroupsRef.current = netGroups
  }, [circuitJson, enabled])

  // Apply highlight to traces
  const applyHighlight = useCallback(
    (schematicTraceIds: Set<string> | null) => {
      const svg = svgDivRef.current
      if (!svg) return

      // Reset all traces
      const allTraceGroups = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"]',
      )
      for (const group of Array.from(allTraceGroups)) {
        const paths = group.querySelectorAll("path")
        for (const path of Array.from(paths)) {
          // Skip invisible hover outline
          if (path.getAttribute("class")?.includes("invisible")) continue
          path.style.filter = ""
          ;(path as any).style.opacity = ""
        }
      }

      // Apply highlight to specified traces
      if (schematicTraceIds && schematicTraceIds.size > 0) {
        for (const traceId of schematicTraceIds) {
          const traceGroups = svg.querySelectorAll(
            `[data-schematic-trace-id="${traceId}"]`,
          )
          for (const group of Array.from(traceGroups)) {
            const paths = group.querySelectorAll("path")
            for (const path of Array.from(paths)) {
              // Skip invisible hover outline and crossing outlines
              const className = path.getAttribute("class") || ""
              if (className.includes("invisible")) continue
              // Apply highlight filter
              path.style.filter = "brightness(1.3) saturate(1.5)"
              ;(path as any).style.opacity = "1"
            }
          }
        }

        // Dim other traces
        for (const group of Array.from(allTraceGroups)) {
          const traceId = group.getAttribute("data-schematic-trace-id")
          if (traceId && !schematicTraceIds.has(traceId)) {
            const paths = group.querySelectorAll("path")
            for (const path of Array.from(paths)) {
              const className = path.getAttribute("class") || ""
              if (className.includes("invisible")) continue
              ;(path as any).style.opacity = "0.3"
            }
          }
        }
      }
    },
    [svgDivRef],
  )

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return

    const svg = svgDivRef.current
    if (!svg) return

    const handleMouseEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement
      const traceId = target.getAttribute("data-schematic-trace-id")
      if (!traceId || !netGroupsRef.current) return

      // Find which net group this trace belongs to
      let targetSourceTraceId: string | null = null
      for (const [sourceTraceId, schematicTraceIds] of netGroupsRef.current) {
        if (schematicTraceIds.has(traceId)) {
          targetSourceTraceId = sourceTraceId
          break
        }
      }

      if (targetSourceTraceId) {
        hoveredTraceRef.current = traceId
        const tracesToHighlight = netGroupsRef.current.get(targetSourceTraceId)
        if (tracesToHighlight) {
          applyHighlight(tracesToHighlight)
        }
      }
    }

    const handleMouseLeave = (e: Event) => {
      const target = e.currentTarget as HTMLElement
      const traceId = target.getAttribute("data-schematic-trace-id")
      if (traceId && hoveredTraceRef.current === traceId) {
        hoveredTraceRef.current = null
        applyHighlight(null)
      }
    }

    // Attach listeners to trace groups
    const attachListeners = () => {
      const traceGroups = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"][data-layer="base"]',
      )
      for (const group of Array.from(traceGroups)) {
        group.addEventListener("mouseenter", handleMouseEnter)
        group.addEventListener("mouseleave", handleMouseLeave)
        // Add pointer cursor to indicate interactivity
        ;(group as HTMLElement).style.cursor = "pointer"
      }
    }

    // Initial attachment
    attachListeners()

    // Re-attach when SVG changes
    const observer = new MutationObserver(() => {
      attachListeners()
    })
    observer.observe(svg, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      const traceGroups = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"][data-layer="base"]',
      )
      for (const group of Array.from(traceGroups)) {
        group.removeEventListener("mouseenter", handleMouseEnter)
        group.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [svgDivRef, enabled, applyHighlight])
}
