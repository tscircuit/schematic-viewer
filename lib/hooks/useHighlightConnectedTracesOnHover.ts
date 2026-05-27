import { useEffect } from "react"
import type { RefObject } from "react"

const HOVER_CLASS = "same-net-trace-hover"
const STYLE_ID = "same-net-trace-hover-style"
const TRACE_SELECTOR = '[data-circuit-json-type="schematic_trace"]'
const NET_KEY_ATTR = "data-subcircuit-connectivity-map-key"

const getSchematicTraceElement = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null

  return target.closest<SVGGElement>(
    `${TRACE_SELECTOR}[data-schematic-trace-id]`,
  )
}

export const useHighlightConnectedTracesOnHover = ({
  svgDivRef,
}: {
  svgDivRef: RefObject<HTMLDivElement | null>
}) => {
  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = `
      .${HOVER_CLASS} {
        filter: invert(1);
      }

      .${HOVER_CLASS} .trace-crossing-outline {
        opacity: 0;
      }
    `
    svg.appendChild(style)

    const clearHighlights = () => {
      for (const element of Array.from(
        svg.querySelectorAll(`.${HOVER_CLASS}`),
      )) {
        element.classList.remove(HOVER_CLASS)
      }
    }

    const highlightMatchingTraces = (traceElement: SVGGElement) => {
      clearHighlights()

      const netKey = traceElement.getAttribute(NET_KEY_ATTR)
      if (!netKey) {
        traceElement.classList.add(HOVER_CLASS)
        return
      }

      for (const matchingTrace of Array.from(
        svg.querySelectorAll<SVGGElement>(
          `${TRACE_SELECTOR}[${NET_KEY_ATTR}="${CSS.escape(netKey)}"]`,
        ),
      )) {
        matchingTrace.classList.add(HOVER_CLASS)
      }
    }

    const handlePointerOver = (event: PointerEvent) => {
      const traceElement = getSchematicTraceElement(event.target)
      if (!traceElement) return
      highlightMatchingTraces(traceElement)
    }

    const handlePointerOut = (event: PointerEvent) => {
      const traceElement = getSchematicTraceElement(event.target)
      if (!traceElement) return

      const relatedTarget = event.relatedTarget
      if (
        relatedTarget instanceof Node &&
        traceElement.contains(relatedTarget)
      ) {
        return
      }

      clearHighlights()
    }

    svg.addEventListener("pointerover", handlePointerOver)
    svg.addEventListener("pointerout", handlePointerOut)

    return () => {
      svg.removeEventListener("pointerover", handlePointerOver)
      svg.removeEventListener("pointerout", handlePointerOut)
      clearHighlights()
      svg.querySelector(`#${STYLE_ID}`)?.remove()
    }
  }, [svgDivRef])
}
