import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

const STYLE_ID = "trace-hover-highlight-style"

function findConnectedSchematicTraceIds(
  circuitJson: CircuitJson,
  hoveredSchematicTraceId: string,
): string[] {
  try {
    const hoveredTrace = su(circuitJson).schematic_trace.get(
      hoveredSchematicTraceId,
    )
    if (!hoveredTrace?.source_trace_id) return [hoveredSchematicTraceId]

    const sourceTrace = su(circuitJson).source_trace.get(
      hoveredTrace.source_trace_id,
    )
    if (!sourceTrace) return [hoveredSchematicTraceId]

    // Walk the net graph: expand the set of connected port IDs and source trace
    // IDs iteratively so multi-segment nets are fully captured
    const connectedPortIds = new Set<string>(
      sourceTrace.connected_source_port_ids ?? [],
    )
    const connectedSourceTraceIds = new Set<string>([
      hoveredTrace.source_trace_id,
    ])

    const allSourceTraces = su(circuitJson).source_trace.list()
    let changed = true
    while (changed) {
      changed = false
      for (const st of allSourceTraces) {
        if (connectedSourceTraceIds.has(st.source_trace_id)) continue
        const sharesPort = st.connected_source_port_ids?.some((pid: string) =>
          connectedPortIds.has(pid),
        )
        if (sharesPort) {
          connectedSourceTraceIds.add(st.source_trace_id)
          for (const pid of st.connected_source_port_ids ?? []) {
            connectedPortIds.add(pid)
          }
          changed = true
        }
      }
    }

    return su(circuitJson)
      .schematic_trace.list()
      .filter((st) => connectedSourceTraceIds.has(st.source_trace_id!))
      .map((st) => st.schematic_trace_id as string)
      .filter(Boolean)
  } catch {
    return [hoveredSchematicTraceId]
  }
}

export function useTraceHoverHighlighting({
  svgDivRef,
  circuitJson,
  enabled = true,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  enabled?: boolean
}) {
  useEffect(() => {
    const container = svgDivRef.current
    if (!container || !enabled) return

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style")
      style.id = STYLE_ID
      style.textContent = `
        .trace-net-highlighted path:not([class*="invisible"]) {
          stroke: #e8b84b !important;
          filter: drop-shadow(0 0 4px #e8b84b99);
          transition: stroke 0.1s ease, filter 0.1s ease;
          cursor: pointer;
        }
      `
      document.head.appendChild(style)
    }

    const clearHighlights = () => {
      container
        .querySelectorAll(".trace-net-highlighted")
        .forEach((el) => el.classList.remove("trace-net-highlighted"))
    }

    const handleMouseOver = (e: Event) => {
      const traceEl = (e.target as Element).closest(
        '[data-circuit-json-type="schematic_trace"]',
      )
      if (!traceEl) return

      const traceId = traceEl.getAttribute("data-schematic-trace-id")
      if (!traceId) return

      clearHighlights()

      const ids = findConnectedSchematicTraceIds(circuitJson, traceId)
      for (const id of ids) {
        container
          .querySelectorAll(`[data-schematic-trace-id="${id}"]`)
          .forEach((el) => el.classList.add("trace-net-highlighted"))
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as Element | null
      if (related?.closest('[data-circuit-json-type="schematic_trace"]')) return
      clearHighlights()
    }

    container.addEventListener("mouseover", handleMouseOver)
    container.addEventListener("mouseout", handleMouseOut as EventListener)

    return () => {
      container.removeEventListener("mouseover", handleMouseOver)
      container.removeEventListener(
        "mouseout",
        handleMouseOut as EventListener,
      )
      clearHighlights()
    }
  }, [svgDivRef, circuitJson, enabled])
}
