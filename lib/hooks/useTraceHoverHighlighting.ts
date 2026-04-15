import { useEffect } from "react"

/**
 * Adds hover highlighting to schematic traces.
 *
 * Traces are rendered as two sibling <g> elements (base layer and overlay
 * layer) both sharing the same `data-schematic-trace-id`. A CSS :hover on
 * one group won't affect the other, so we use JS to add/remove a
 * `trace-hover` class on *all* groups that share the same trace id whenever
 * the pointer enters or leaves any of them.
 *
 * A MutationObserver watches for SVG re-renders (e.g. on resize) and
 * re-attaches listeners automatically.
 */
export function useTraceHoverHighlighting({
  svgDivRef,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJsonKey: string
}) {
  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    let cleanupListeners: (() => void) | null = null

    function attachListeners() {
      if (!svgDiv) return
      if (cleanupListeners) cleanupListeners()

      const handlers: Array<{
        el: SVGGElement
        enter: () => void
        leave: () => void
      }> = []

      const groups = svgDiv.querySelectorAll<SVGGElement>(
        "g[data-schematic-trace-id]",
      )

      for (const group of groups) {
        const traceId = group.getAttribute("data-schematic-trace-id")
        if (!traceId) continue

        const handleEnter = () => {
          const siblings = svgDiv!.querySelectorAll<SVGGElement>(
            `g[data-schematic-trace-id="${traceId}"]`,
          )
          for (const sibling of siblings) {
            sibling.classList.add("trace-hover")
          }
        }

        const handleLeave = () => {
          const siblings = svgDiv!.querySelectorAll<SVGGElement>(
            `g[data-schematic-trace-id="${traceId}"]`,
          )
          for (const sibling of siblings) {
            sibling.classList.remove("trace-hover")
          }
        }

        group.addEventListener("mouseenter", handleEnter)
        group.addEventListener("mouseleave", handleLeave)
        handlers.push({ el: group, enter: handleEnter, leave: handleLeave })
      }

      cleanupListeners = () => {
        for (const { el, enter, leave } of handlers) {
          el.removeEventListener("mouseenter", enter)
          el.removeEventListener("mouseleave", leave)
        }
      }
    }

    // Initial attach
    attachListeners()

    // Re-attach whenever the SVG is re-rendered (e.g. on window resize)
    const observer =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            attachListeners()
          })
        : null

    observer?.observe(svgDiv, { childList: true, subtree: false })

    return () => {
      observer?.disconnect()
      cleanupListeners?.()
    }
  }, [svgDivRef, circuitJsonKey])
}
