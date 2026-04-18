import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

const STYLE_ID = "net-hover-highlight-style"
const HIGHLIGHT_CLASS = "net-hover-highlighted"

export const useNetHoverHighlighting = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  useEffect(() => {
    const container = svgDivRef.current
    if (!container) return

    const ensureStyle = () => {
      if (container.querySelector(`style#${STYLE_ID}`)) return
      const style = document.createElement("style")
      style.id = STYLE_ID
      style.textContent = `
        .${HIGHLIGHT_CLASS} {
          stroke: #ff6b35 !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 0 3px rgba(255,107,53,0.7));
        }
      `
      container.appendChild(style)
    }

    const resetHighlights = () => {
      for (const el of Array.from(container.querySelectorAll(`.${HIGHLIGHT_CLASS}`))) {
        el.classList.remove(HIGHLIGHT_CLASS)
      }
    }

    const getConnectedSchematicTraceIds = (schematicTraceId: string): Set<string> => {
      const result = new Set<string>()

      const schTrace = su(circuitJson)
        .schematic_trace.list()
        .find((st) => st.schematic_trace_id === schematicTraceId)

      if (!schTrace?.source_trace_id) {
        result.add(schematicTraceId)
        return result
      }

      const srcTrace = su(circuitJson)
        .source_trace.list()
        .find((st) => st.source_trace_id === schTrace.source_trace_id)

      if (!srcTrace) {
        for (const st of su(circuitJson).schematic_trace.list()) {
          if (st.source_trace_id === schTrace.source_trace_id) {
            result.add(st.schematic_trace_id)
          }
        }
        return result
      }

      const netIds = new Set<string>(srcTrace.connected_source_net_ids ?? [])

      if (netIds.size === 0) {
        for (const st of su(circuitJson).schematic_trace.list()) {
          if (st.source_trace_id === schTrace.source_trace_id) {
            result.add(st.schematic_trace_id)
          }
        }
        return result
      }

      const connectedSrcTraceIds = new Set<string>()
      for (const st of su(circuitJson).source_trace.list()) {
        const stNets: string[] = st.connected_source_net_ids ?? []
        if (stNets.some((nid) => netIds.has(nid))) {
          connectedSrcTraceIds.add(st.source_trace_id)
        }
      }

      for (const st of su(circuitJson).schematic_trace.list()) {
        if (st.source_trace_id && connectedSrcTraceIds.has(st.source_trace_id)) {
          result.add(st.schematic_trace_id)
        }
      }

      return result
    }

    const handleMouseOver = (event: MouseEvent) => {
      const traceEl = (event.target as Element).closest("[data-schematic-trace-id]")
      if (!traceEl) return
      const id = traceEl.getAttribute("data-schematic-trace-id")
      if (!id) return
      ensureStyle()
      resetHighlights()
      for (const traceId of getConnectedSchematicTraceIds(id)) {
        const paths = container.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"] path:not(.invisible)`
        )
        for (const path of Array.from(paths)) {
          path.classList.add(HIGHLIGHT_CLASS)
        }
      }
    }

    const handleMouseLeave = () => resetHighlights()

    container.addEventListener("mouseover", handleMouseOver)
    container.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      container.removeEventListener("mouseover", handleMouseOver)
      container.removeEventListener("mouseleave", handleMouseLeave)
      container.querySelector(`style#${STYLE_ID}`)?.remove()
    }
  }, [svgDivRef, circuitJson])
}
