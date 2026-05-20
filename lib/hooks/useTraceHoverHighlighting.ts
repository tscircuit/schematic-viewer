import { useEffect, useMemo } from "react"
import type { CircuitJson } from "circuit-json"
import { getSchematicTraceNetKeyMap } from "lib/utils/get-schematic-trace-net-keys"

const HOVER_FILTER = "brightness(1.3) drop-shadow(0 0 3px rgba(255, 107, 53, 0.5))"

export const useTraceHoverHighlighting = ({
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
  const schematicTraceNetKeyMap = useMemo(
    () => getSchematicTraceNetKeyMap(circuitJson),
    [circuitJsonKey, circuitJson],
  )

  useEffect(() => {
    const svgRoot = svgDivRef.current
    if (!svgRoot) return

    const traceGroups = Array.from(
      svgRoot.querySelectorAll<SVGGElement>(
        '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      ),
    )

    const netKeyToElements = new Map<string, SVGGElement[]>()

    for (const el of traceGroups) {
      const id = el.dataset.schematicTraceId
      if (!id) continue
      const netKey = schematicTraceNetKeyMap.get(id)
      const key = netKey ?? `single:${id}`
      if (!netKeyToElements.has(key)) {
        netKeyToElements.set(key, [])
      }
      netKeyToElements.get(key)!.push(el)
    }

    const cleanupCallbacks: Array<() => void> = []

    for (const sameNetElements of netKeyToElements.values()) {
      const applyHover = () => {
        if (!enabled) return
        for (const el of sameNetElements) {
          el.style.filter = HOVER_FILTER
        }
      }

      const removeHover = () => {
        for (const el of sameNetElements) {
          el.style.filter = ""
        }
      }

      for (const el of sameNetElements) {
        el.addEventListener("mouseenter", applyHover)
        el.addEventListener("mouseleave", removeHover)
        cleanupCallbacks.push(() => {
          el.removeEventListener("mouseenter", applyHover)
          el.removeEventListener("mouseleave", removeHover)
          el.style.filter = ""
        })
      }
    }

    return () => {
      for (const cleanup of cleanupCallbacks) cleanup()
    }
  }, [circuitJsonKey, svgDivRef, schematicTraceNetKeyMap, enabled])
}
