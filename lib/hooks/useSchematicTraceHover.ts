import { useEffect } from "react"

const HIGHLIGHT_COLOR = "#e8a020"

export const useSchematicTraceHover = ({
  svgDivRef,
  enabled = true,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  enabled?: boolean
}) => {
  useEffect(() => {
    if (!enabled) return
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const clearHighlights = () => {
      svgDiv
        .querySelectorAll<SVGElement>(".trace-net-highlighted")
        .forEach((el) => el.classList.remove("trace-net-highlighted"))
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as SVGElement
      const traceGroup = target.closest<SVGElement>("[data-schematic-trace-id]")
      if (!traceGroup) {
        clearHighlights()
        return
      }

      clearHighlights()

      const netKey = traceGroup.getAttribute(
        "data-subcircuit-connectivity-map-key",
      )

      if (netKey) {
        svgDiv
          .querySelectorAll<SVGElement>(
            `[data-subcircuit-connectivity-map-key="${CSS.escape(netKey)}"]`,
          )
          .forEach((el) => el.classList.add("trace-net-highlighted"))
      } else {
        // No net key ΓÇö highlight just this trace
        traceGroup.classList.add("trace-net-highlighted")
        // Also highlight its overlay counterpart (same trace-id, different layer)
        const traceId = traceGroup.getAttribute("data-schematic-trace-id")
        if (traceId) {
          svgDiv
            .querySelectorAll<SVGElement>(
              `[data-schematic-trace-id="${CSS.escape(traceId)}"]`,
            )
            .forEach((el) => el.classList.add("trace-net-highlighted"))
        }
      }
    }

    const handleMouseLeave = () => clearHighlights()

    svgDiv.addEventListener("mouseover", handleMouseOver)
    svgDiv.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      svgDiv.removeEventListener("mouseover", handleMouseOver)
      svgDiv.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [svgDivRef, enabled])
}

export { HIGHLIGHT_COLOR }
