import { useEffect, useRef } from "react"

const TRACE_NET_HOVER_CLASS = "trace-net-hover"

const escapeAttributeValue = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

export const useTraceNetHoverHighlight = ({
  svgDivRef,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJsonKey: string
}) => {
  const activeNetKeyRef = useRef<string | null>(null)
  const activeElementsRef = useRef<SVGElement[]>([])

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const clearHighlight = () => {
      for (const element of activeElementsRef.current) {
        element.classList.remove(TRACE_NET_HOVER_CLASS)
      }
      activeElementsRef.current = []
      activeNetKeyRef.current = null
    }

    const getNetKeyFromTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null
      return (
        target
          .closest<SVGElement>('[data-circuit-json-type="schematic_trace"]')
          ?.getAttribute("data-subcircuit-connectivity-map-key") ?? null
      )
    }

    const applyHighlight = (netKey: string) => {
      if (activeNetKeyRef.current === netKey) return

      clearHighlight()
      activeNetKeyRef.current = netKey

      const escapedNetKey = escapeAttributeValue(netKey)
      const selector = `[data-circuit-json-type="schematic_trace"][data-subcircuit-connectivity-map-key="${escapedNetKey}"]`
      const elements = Array.from(svgDiv.querySelectorAll<SVGElement>(selector))
      for (const element of elements) {
        element.classList.add(TRACE_NET_HOVER_CLASS)
      }
      activeElementsRef.current = elements
    }

    const handleMouseOver = (event: MouseEvent) => {
      const netKey = getNetKeyFromTarget(event.target)
      if (!netKey) return
      applyHighlight(netKey)
    }

    const handleMouseOut = (event: MouseEvent) => {
      const currentNetKey = getNetKeyFromTarget(event.target)
      if (!currentNetKey) return

      const nextNetKey = getNetKeyFromTarget(event.relatedTarget)
      if (nextNetKey === currentNetKey) return

      clearHighlight()
    }

    svgDiv.addEventListener("mouseover", handleMouseOver)
    svgDiv.addEventListener("mouseout", handleMouseOut)

    return () => {
      svgDiv.removeEventListener("mouseover", handleMouseOver)
      svgDiv.removeEventListener("mouseout", handleMouseOut)
      clearHighlight()
    }
  }, [svgDivRef, circuitJsonKey])
}
