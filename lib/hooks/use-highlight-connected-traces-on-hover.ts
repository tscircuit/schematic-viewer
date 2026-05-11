import { useEffect, useMemo } from "react"
import type { CircuitJson } from "circuit-json"
import { getConnectedSchematicTraceIdsByTraceId } from "lib/utils/get-connected-schematic-trace-ids"

const highlightClassName = "schematic-connected-trace-hover"

const escapeAttributeValue = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

const getTraceElement = (element: EventTarget | null): Element | null => {
  if (!(element instanceof Element)) return null

  return element.closest(
    '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
  )
}

const getTraceId = (element: Element | null): string | null =>
  element?.getAttribute("data-schematic-trace-id") ?? null

const ensureHighlightStyle = (svgDiv: HTMLDivElement) => {
  const existingStyle = svgDiv.querySelector(
    "style#schematic-connected-trace-hover-style",
  )
  if (existingStyle) return null

  const style = document.createElement("style")
  style.id = "schematic-connected-trace-hover-style"
  style.textContent = `
    [data-circuit-json-type="schematic_trace"].${highlightClassName} {
      filter: none !important;
    }

    [data-circuit-json-type="schematic_trace"].${highlightClassName} path:not(.trace-invisible-hover-outline) {
      filter: drop-shadow(0 0 3px rgba(255, 107, 53, 0.55));
      stroke: #ff6b35 !important;
      transition: filter 120ms ease, stroke 120ms ease, stroke-width 120ms ease;
    }

    [data-circuit-json-type="schematic_trace"] {
      cursor: pointer;
    }
  `
  svgDiv.appendChild(style)

  return style
}

export const useHighlightConnectedTracesOnHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
  enabled,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  enabled: boolean
}) => {
  const connectedTraceIdsByTraceId = useMemo(
    () => getConnectedSchematicTraceIdsByTraceId(circuitJson),
    [circuitJson, circuitJsonKey],
  )

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const clearHighlights = () => {
      for (const trace of Array.from(
        svgDiv.querySelectorAll(`.${highlightClassName}`),
      )) {
        trace.classList.remove(highlightClassName)
      }
    }

    if (!enabled) {
      clearHighlights()
      return
    }

    const style = ensureHighlightStyle(svgDiv)
    let activeTraceIds = new Set<string>()

    const highlightConnectedTraces = (traceId: string) => {
      const nextTraceIds =
        connectedTraceIdsByTraceId.get(traceId) ?? new Set([traceId])

      clearHighlights()
      activeTraceIds = nextTraceIds

      for (const connectedTraceId of nextTraceIds) {
        const trace = svgDiv.querySelector(
          `[data-schematic-trace-id="${escapeAttributeValue(
            connectedTraceId,
          )}"]`,
        )
        trace?.classList.add(highlightClassName)
      }
    }

    const handleMouseOver = (event: MouseEvent) => {
      const traceId = getTraceId(getTraceElement(event.target))
      if (!traceId) return

      highlightConnectedTraces(traceId)
    }

    const handleMouseOut = (event: MouseEvent) => {
      const nextTraceId = getTraceId(getTraceElement(event.relatedTarget))
      if (nextTraceId && activeTraceIds.has(nextTraceId)) return

      activeTraceIds = new Set()
      clearHighlights()
    }

    svgDiv.addEventListener("mouseover", handleMouseOver)
    svgDiv.addEventListener("mouseout", handleMouseOut)

    return () => {
      svgDiv.removeEventListener("mouseover", handleMouseOver)
      svgDiv.removeEventListener("mouseout", handleMouseOut)
      activeTraceIds = new Set()
      clearHighlights()
      style?.remove()
    }
  }, [svgDivRef, connectedTraceIdsByTraceId, enabled])
}
