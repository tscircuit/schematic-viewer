import type { CircuitJson } from "circuit-json"
import { useEffect } from "react"
import { getConnectedSchematicTraceIdsByHoveredTrace } from "../utils/getConnectedSchematicTraceIdsByHoveredTrace"

const HOVER_ATTR = "data-schematic-trace-net-hover"
const TRACE_SELECTOR =
  '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]'

export const schematicTraceHoverStyle = `
  [data-circuit-json-type="schematic_trace"][${HOVER_ATTR}="true"] path:not(.trace-invisible-hover-outline):not([class*="invisible"]) {
    stroke: var(--tscircuit-schematic-trace-hover-color, #3b82f6) !important;
  }

  [data-circuit-json-type="schematic_trace"][${HOVER_ATTR}="true"] circle {
    stroke: var(--tscircuit-schematic-trace-hover-color, #3b82f6) !important;
    fill: var(--tscircuit-schematic-trace-hover-color, #3b82f6) !important;
  }

  [data-circuit-json-type="schematic_trace"][${HOVER_ATTR}="true"] .trace-crossing-outline {
    opacity: 0;
  }
`

const getTraceElement = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null
  return target.closest(TRACE_SELECTOR)
}

export const useHighlightConnectedTracesOnHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const connectedSchematicTraceIdsByTraceId =
      getConnectedSchematicTraceIdsByHoveredTrace(circuitJson)

    let currentHoveredTraceId: string | null = null

    const clearHighlightedTraces = () => {
      currentHoveredTraceId = null
      for (const traceElement of Array.from(
        svg.querySelectorAll(`[${HOVER_ATTR}]`),
      )) {
        traceElement.removeAttribute(HOVER_ATTR)
      }
    }

    const highlightConnectedTraces = (schematicTraceId: string) => {
      if (schematicTraceId === currentHoveredTraceId) return

      currentHoveredTraceId = schematicTraceId
      const connectedSchematicTraceIds =
        connectedSchematicTraceIdsByTraceId.get(schematicTraceId) ??
        new Set([schematicTraceId])

      for (const traceElement of Array.from(
        svg.querySelectorAll(TRACE_SELECTOR),
      )) {
        const traceId = traceElement.getAttribute("data-schematic-trace-id")
        if (traceId && connectedSchematicTraceIds.has(traceId)) {
          traceElement.setAttribute(HOVER_ATTR, "true")
        } else {
          traceElement.removeAttribute(HOVER_ATTR)
        }
      }
    }

    const handlePointerOver = (event: PointerEvent) => {
      const traceElement = getTraceElement(event.target)
      const schematicTraceId = traceElement?.getAttribute(
        "data-schematic-trace-id",
      )
      if (!schematicTraceId) return

      highlightConnectedTraces(schematicTraceId)
    }

    const handlePointerOut = (event: PointerEvent) => {
      const nextTraceElement = getTraceElement(event.relatedTarget)
      if (!nextTraceElement) {
        clearHighlightedTraces()
      }
    }

    svg.addEventListener("pointerover", handlePointerOver)
    svg.addEventListener("pointerout", handlePointerOut)
    svg.addEventListener("pointerleave", clearHighlightedTraces)

    return () => {
      svg.removeEventListener("pointerover", handlePointerOver)
      svg.removeEventListener("pointerout", handlePointerOut)
      svg.removeEventListener("pointerleave", clearHighlightedTraces)
      clearHighlightedTraces()
    }
  }, [svgDivRef, circuitJson, circuitJsonKey])
}
