import { useEffect, useMemo, useRef } from "react"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

const HIGHLIGHT_CLASS = "schematic-viewer-trace-hover-highlight"
const STYLE_ELEMENT_ID = "schematic-viewer-trace-hover-style"
const HIGHLIGHT_COLOR = "#ff6b35"

const ensureStyleInjected = () => {
  if (typeof document === "undefined") return
  if (document.getElementById(STYLE_ELEMENT_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ELEMENT_ID
  style.textContent = `
.${HIGHLIGHT_CLASS} path,
.${HIGHLIGHT_CLASS} line,
.${HIGHLIGHT_CLASS} polyline,
.${HIGHLIGHT_CLASS} circle,
.${HIGHLIGHT_CLASS} rect {
  stroke: ${HIGHLIGHT_COLOR} !important;
  stroke-width: 2.5px !important;
  filter: drop-shadow(0 0 1.5px rgba(255, 107, 53, 0.55));
  transition: stroke 0.12s ease, stroke-width 0.12s ease;
}
`
  document.head.appendChild(style)
}

interface Options {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  enabled?: boolean
}

/**
 * On hover over a schematic_trace, highlights every other trace that is on the
 * same electrical net (computed via the full connectivity map, so disjoint
 * trace segments that share a net or share a port are all highlighted).
 */
export const useConnectedTracesHoverHighlighting = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
  enabled = true,
}: Options) => {
  const traceIdToGroupKey = useMemo(() => {
    const map = new Map<string, string>()
    if (!enabled) return map

    try {
      const sourceElements = circuitJson.filter((e) =>
        e.type.startsWith("source_"),
      ) as any[]

      const connectivity = getFullConnectivityMapFromCircuitJson(sourceElements)
      const netMap = connectivity.netMap as Record<string, string[]>

      const sourceTraceIdToNetKey = new Map<string, string>()
      for (const [netKey, connectedIds] of Object.entries(netMap)) {
        for (const id of connectedIds) {
          if (id.startsWith("source_trace_")) {
            sourceTraceIdToNetKey.set(id, netKey)
          }
        }
      }

      const schematicTraces =
        su(circuitJson as any).schematic_trace?.list() ?? []
      for (const schTrace of schematicTraces) {
        const netKey = sourceTraceIdToNetKey.get(schTrace.source_trace_id)
        if (netKey) {
          map.set(schTrace.schematic_trace_id, netKey)
        }
      }
    } catch (err) {
      console.error(
        "[schematic-viewer] failed to build trace connectivity map",
        err,
      )
    }

    return map
  }, [circuitJsonKey, enabled])

  const groupKeyToTraceIds = useMemo(() => {
    const reverse = new Map<string, Set<string>>()
    for (const [traceId, key] of traceIdToGroupKey.entries()) {
      let set = reverse.get(key)
      if (!set) {
        set = new Set()
        reverse.set(key, set)
      }
      set.add(traceId)
    }
    return reverse
  }, [traceIdToGroupKey])

  const activeKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const container = svgDivRef.current
    if (!container) return

    ensureStyleInjected()

    const clearHighlight = () => {
      if (!activeKeyRef.current) return
      const elements = container.querySelectorAll(`.${HIGHLIGHT_CLASS}`)
      elements.forEach((el) => el.classList.remove(HIGHLIGHT_CLASS))
      activeKeyRef.current = null
    }

    const applyHighlight = (key: string) => {
      if (activeKeyRef.current === key) return
      clearHighlight()
      const traceIds = groupKeyToTraceIds.get(key)
      if (!traceIds || traceIds.size === 0) return
      for (const traceId of traceIds) {
        const escaped =
          typeof CSS !== "undefined" && CSS.escape
            ? CSS.escape(traceId)
            : traceId.replace(/"/g, '\\"')
        container
          .querySelectorAll(`[data-schematic-trace-id="${escaped}"]`)
          .forEach((el) => el.classList.add(HIGHLIGHT_CLASS))
      }
      activeKeyRef.current = key
    }

    const getTraceIdFromEvent = (target: EventTarget | null): string | null => {
      if (!(target instanceof Element)) return null
      const traceGroup = target.closest("[data-schematic-trace-id]")
      if (!traceGroup) return null
      return traceGroup.getAttribute("data-schematic-trace-id")
    }

    const handleMouseOver = (e: MouseEvent) => {
      const traceId = getTraceIdFromEvent(e.target)
      if (!traceId) return
      const key = traceIdToGroupKey.get(traceId)
      if (!key) return
      applyHighlight(key)
    }

    const handleMouseOut = (e: MouseEvent) => {
      const fromTraceId = getTraceIdFromEvent(e.target)
      if (!fromTraceId) return
      const toTraceId = getTraceIdFromEvent(e.relatedTarget)
      if (toTraceId) {
        const toKey = traceIdToGroupKey.get(toTraceId)
        if (toKey && toKey === activeKeyRef.current) return
      }
      clearHighlight()
    }

    container.addEventListener("mouseover", handleMouseOver)
    container.addEventListener("mouseout", handleMouseOut)

    return () => {
      container.removeEventListener("mouseover", handleMouseOver)
      container.removeEventListener("mouseout", handleMouseOut)
      clearHighlight()
    }
  }, [svgDivRef, enabled, traceIdToGroupKey, groupKeyToTraceIds])
}
