import { useCallback, useEffect, useRef } from "react"
import type { CircuitJson } from "circuit-json"
import { su } from "@tscircuit/soup-util"

type SvgDivRef = React.RefObject<HTMLDivElement | null>

const TRACE_SEL = "g.trace[data-subcircuit-connectivity-map-key]"

function getConnectivityKey(el: Element): string | null {
  return el.getAttribute("data-subcircuit-connectivity-map-key")
}

/**
 * Hook that highlights all traces sharing the same connectivity key
 * when any trace in that net is hovered.
 *
 * Works by attaching mouseenter/mouseleave handlers to every `<g class="trace">`
 * element and toggling a `.trace-highlighted` class on all traces in the same net.
 *
 * The approach avoids `:has()` CSS selectors (which have inconsistent SVG support)
 * and instead uses direct DOM class manipulation on mouse events.
 */
export function useTraceHoverHighlight({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: SvgDivRef
  circuitJson: CircuitJson
}) {
  const highlightedKeyRef = useRef<string | null>(null)
  const isHoveringRef = useRef(false)

  const getNetKeyToIdMap = useCallback(() => {
    const map = new Map<string, string[]>()
    for (const elm of circuitJson) {
      if (elm.type !== "schematic_trace") continue
      const key = (elm as any).subcircuit_connectivity_map_key as
        | string
        | undefined
      const id = (elm as any).schematic_trace_id as string | undefined
      if (!key || !id) continue
      const ids = map.get(key) ?? []
      ids.push(id)
      map.set(key, ids)
    }
    return map
  }, [circuitJson])

  const applyHighlightForTrace = useCallback(
    (traceEl: Element) => {
      const key = getConnectivityKey(traceEl)
      if (!key) return

      highlightedKeyRef.current = key

      const svgDiv = svgDivRef.current
      if (!svgDiv) return

      const allTraces = svgDiv.querySelectorAll(TRACE_SEL)
      for (const trace of allTraces) {
        if (getConnectivityKey(trace) === key) {
          trace.classList.add("trace-highlighted")
        } else {
          trace.classList.remove("trace-highlighted")
        }
      }

      // Also highlight the overlay groups
      const allOverlays = svgDiv.querySelectorAll(
        "g.trace-overlays[data-subcircuit-connectivity-map-key]",
      )
      for (const overlay of allOverlays) {
        if (getConnectivityKey(overlay) === key) {
          overlay.classList.add("trace-highlighted")
        } else {
          overlay.classList.remove("trace-highlighted")
        }
      }
    },
    [svgDivRef],
  )

  const removeHighlight = useCallback(() => {
    highlightedKeyRef.current = null

    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const highlighted = svgDiv.querySelectorAll(".trace-highlighted")
    for (const el of highlighted) {
      el.classList.remove("trace-highlighted")
    }
  }, [svgDivRef])

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const handleMouseEnter = (e: Event) => {
      if (isHoveringRef.current) return
      isHoveringRef.current = true
      const target = e.currentTarget as Element
      applyHighlightForTrace(target)
    }

    const handleMouseLeave = (e: Event) => {
      const target = e.currentTarget as Element
      const relatedTarget = e.relatedTarget as Element | null

      // Check if the mouse is moving to another trace in the same net
      if (
        relatedTarget &&
        getConnectivityKey(relatedTarget) === getConnectivityKey(target)
      ) {
        return
      }

      isHoveringRef.current = false
      removeHighlight()
    }

    // Attach listeners to all trace groups
    const traces = svgDiv.querySelectorAll(TRACE_SEL)
    for (const trace of traces) {
      trace.addEventListener("mouseenter", handleMouseEnter)
      trace.addEventListener("mouseleave", handleMouseLeave)
    }

    // Also attach to overlay groups so hovering over crossings/hops also works
    const overlays = svgDiv.querySelectorAll(
      "g.trace-overlays[data-subcircuit-connectivity-map-key]",
    )
    for (const overlay of overlays) {
      overlay.addEventListener("mouseenter", handleMouseEnter)
      overlay.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      for (const trace of traces) {
        trace.removeEventListener("mouseenter", handleMouseEnter)
        trace.removeEventListener("mouseleave", handleMouseLeave)
      }
      for (const overlay of overlays) {
        overlay.removeEventListener("mouseenter", handleMouseEnter)
        overlay.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [svgDivRef, applyHighlightForTrace, removeHighlight])
}
