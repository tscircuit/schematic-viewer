import type { CircuitJson } from "circuit-json"
import { type RefObject, useEffect, useRef } from "react"
import { getConnectedSchematicTraceIds } from "../utils/trace-connectivity"

const HIGHLIGHT_CLASS = "schematic-viewer-net-hover-highlight"
const STYLE_ID = "schematic-viewer-net-hover-style"

const escapeAttributeValue = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

export const useHighlightConnectedSchematicTraces = ({
  svgDivRef,
  circuitJson,
  svgContentKey,
  enabled = true,
}: {
  svgDivRef: RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  svgContentKey?: string
  enabled?: boolean
}) => {
  const highlightedPathsRef = useRef<Element[]>([])

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv || !enabled) return

    const clearHighlights = () => {
      for (const path of highlightedPathsRef.current) {
        path.classList.remove(HIGHLIGHT_CLASS)
      }
      highlightedPathsRef.current = []
    }

    const getTracePaths = (schematicTraceId: string) => {
      const escapedTraceId = escapeAttributeValue(schematicTraceId)
      return Array.from(
        svgDiv.querySelectorAll(
          `[data-schematic-trace-id="${escapedTraceId}"] path`,
        ),
      ).filter((path) => {
        const className = path.getAttribute("class") ?? ""
        return (
          !className.includes("invisible") &&
          path.getAttribute("opacity") !== "0"
        )
      })
    }

    const applyHighlights = (schematicTraceId: string) => {
      clearHighlights()

      const connectedTraceIds = getConnectedSchematicTraceIds(
        circuitJson,
        schematicTraceId,
      )
      const highlightedPaths = connectedTraceIds.flatMap(getTracePaths)

      for (const path of highlightedPaths) {
        path.classList.add(HIGHLIGHT_CLASS)
      }

      highlightedPathsRef.current = highlightedPaths
    }

    const ensureStyle = () => {
      const existingStyle = svgDiv.querySelector<HTMLStyleElement>(
        `style#${STYLE_ID}`,
      )
      if (existingStyle) return existingStyle

      const style = document.createElement("style")
      style.id = STYLE_ID
      style.textContent = `
        .${HIGHLIGHT_CLASS} {
          stroke: #f97316 !important;
          opacity: 1 !important;
          filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.75));
          transition: stroke 120ms ease, filter 120ms ease;
        }

        [data-schematic-trace-id] {
          cursor: pointer;
        }
      `
      svgDiv.appendChild(style)
      return style
    }

    const handlePointerEnter = (event: Event) => {
      const traceElement = event.currentTarget as Element
      const schematicTraceId = traceElement.getAttribute(
        "data-schematic-trace-id",
      )
      if (!schematicTraceId) return

      applyHighlights(schematicTraceId)
    }

    const traceElements = Array.from(
      svgDiv.querySelectorAll("[data-schematic-trace-id]"),
    )

    const styleElement = ensureStyle()
    for (const traceElement of traceElements) {
      traceElement.addEventListener("pointerenter", handlePointerEnter)
    }
    svgDiv.addEventListener("pointerleave", clearHighlights)
    svgDiv.addEventListener("pointercancel", clearHighlights)

    return () => {
      for (const traceElement of traceElements) {
        traceElement.removeEventListener("pointerenter", handlePointerEnter)
      }
      svgDiv.removeEventListener("pointerleave", clearHighlights)
      svgDiv.removeEventListener("pointercancel", clearHighlights)
      styleElement.remove()
      clearHighlights()
    }
  }, [svgDivRef, circuitJson, svgContentKey, enabled])
}
