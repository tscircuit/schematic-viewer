import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

interface UseHighlightTracesOnHoverOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}

/**
 * Highlights all schematic traces in the same net when hovering over one
 */
export const useHighlightTracesOnHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: UseHighlightTracesOnHoverOptions) => {
  useEffect(() => {
    const svgContainer = svgDivRef.current
    if (!svgContainer) return

    const svg = svgContainer.querySelector("svg")
    if (!svg) return

    // Build mapping of trace IDs to their subcircuit connectivity keys
    const traceList = su(circuitJson).schematic_trace?.list?.() || []

    const traceIdToKey = new Map<string, string>()
    const keyToTraceIds = new Map<string, string[]>()

    for (const trace of traceList as any[]) {
      const key = trace.subcircuit_connectivity_key
      if (!key) continue

      traceIdToKey.set(trace.schematic_trace_id, key)
      if (!keyToTraceIds.has(key)) keyToTraceIds.set(key, [])
      keyToTraceIds.get(key)!.push(trace.schematic_trace_id)
    }

    // Ensure style for highlighting exists
    if (!svg.querySelector("style#net-hover-highlight")) {
      const style = document.createElement("style")
      style.id = "net-hover-highlight"
      style.textContent = `.net-hover-highlight { stroke: #ffa500; stroke-width: 3; }`
      svg.appendChild(style)
    }

    const clearHighlights = () => {
      const highlighted = svg.querySelectorAll(".net-hover-highlight")
      highlighted.forEach((el) => el.classList.remove("net-hover-highlight"))
    }

    const handleEnter = (traceId: string) => {
      clearHighlights()
      const key = traceIdToKey.get(traceId)
      if (!key) return
      const related = keyToTraceIds.get(key) || []
      for (const id of related) {
        const elements = svg.querySelectorAll(
          `[data-schematic-trace-id="${id}"] path`,
        )
        for (const el of Array.from(elements)) {
          ;(el as Element).classList.add("net-hover-highlight")
        }
      }
    }

    const handleLeave = () => {
      clearHighlights()
    }

    // Attach listeners to each trace path
    const pathElements = svg.querySelectorAll(
      '[data-circuit-json-type="schematic_trace"] path',
    )
    const listeners: Array<{
      el: Element
      enter: () => void
      leave: () => void
    }> = []

    for (const pathEl of Array.from(pathElements)) {
      const parent = (pathEl as Element).closest(
        "[data-schematic-trace-id]",
      ) as Element | null
      const traceId = parent?.getAttribute("data-schematic-trace-id")
      if (!traceId) continue
      const enter = () => handleEnter(traceId)
      const leave = handleLeave
      pathEl.addEventListener("mouseenter", enter)
      pathEl.addEventListener("mouseleave", leave)
      listeners.push({ el: pathEl, enter, leave })
    }

    return () => {
      listeners.forEach(({ el, enter, leave }) => {
        el.removeEventListener("mouseenter", enter)
        el.removeEventListener("mouseleave", leave)
      })
      clearHighlights()
    }
  }, [svgDivRef, circuitJson, circuitJsonKey])
}
