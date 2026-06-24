import { useEffect, useRef } from "react"

const TRACE_GROUP_SELECTOR = '[data-circuit-json-type="schematic_trace"]'
const CONNECTIVITY_KEY_ATTR = "data-subcircuit-connectivity-map-key"
const HOVERED_ATTR = "data-net-hovered"

const getTraceGroupKey = (element: Element | null) => {
  if (!element) return null
  return (
    element.getAttribute(CONNECTIVITY_KEY_ATTR) ??
    element.getAttribute("data-schematic-trace-id")
  )
}

export const useTraceHoverHighlight = ({
  svgDivRef,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
}) => {
  const hoveredKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const svgRoot = svgDivRef.current
    if (!svgRoot) return

    const clearHoveredTraces = () => {
      const hoveredTraces = svgRoot.querySelectorAll(`[${HOVERED_ATTR}="true"]`)
      for (const trace of Array.from(hoveredTraces)) {
        trace.removeAttribute(HOVERED_ATTR)
      }
      hoveredKeyRef.current = null
    }

    const setHoveredTraces = (key: string) => {
      if (hoveredKeyRef.current === key) return

      clearHoveredTraces()

      const escapedKey =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(key)
          : key.replaceAll('"', '\\"')

      const matchingTraceGroups = svgRoot.querySelectorAll(
        `${TRACE_GROUP_SELECTOR}[${CONNECTIVITY_KEY_ATTR}="${escapedKey}"]`,
      )
      for (const traceGroup of Array.from(matchingTraceGroups)) {
        traceGroup.setAttribute(HOVERED_ATTR, "true")
      }

      hoveredKeyRef.current = key
    }

    const handlePointerOver = (event: Event) => {
      const target = event.target as Element | null
      const traceGroup = target?.closest(TRACE_GROUP_SELECTOR) ?? null
      const traceKey = getTraceGroupKey(traceGroup)
      if (!traceKey) return
      setHoveredTraces(traceKey)
    }

    const handlePointerOut = (event: Event) => {
      const target = event.target as Element | null
      const traceGroup = target?.closest(TRACE_GROUP_SELECTOR) ?? null
      const traceKey = getTraceGroupKey(traceGroup)
      if (!traceKey) return

      const relatedTarget = (event as PointerEvent).relatedTarget
      const relatedElement =
        relatedTarget instanceof Element ? relatedTarget : null
      const relatedTraceGroup =
        relatedElement?.closest(TRACE_GROUP_SELECTOR) ?? null
      const relatedKey = getTraceGroupKey(relatedTraceGroup)

      if (relatedKey && relatedKey === traceKey) {
        return
      }

      if (hoveredKeyRef.current === traceKey) {
        clearHoveredTraces()
      }
    }

    svgRoot.addEventListener("pointerover", handlePointerOver)
    svgRoot.addEventListener("pointerout", handlePointerOut)

    return () => {
      svgRoot.removeEventListener("pointerover", handlePointerOver)
      svgRoot.removeEventListener("pointerout", handlePointerOut)
      clearHoveredTraces()
    }
  }, [svgDivRef])
}
