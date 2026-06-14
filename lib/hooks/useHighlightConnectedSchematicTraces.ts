import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

interface UseHighlightConnectedSchematicTracesOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  svgString: string
}

export const useHighlightConnectedSchematicTraces = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
  svgString,
}: UseHighlightConnectedSchematicTracesOptions) => {
  useEffect(() => {
    const svgDiv = svgDivRef.current
    const svg = svgDiv?.querySelector("svg")
    if (!svg) return

    const schematicTraces = su(circuitJson).schematic_trace?.list() ?? []
    const netKeyToTraceIds = new Map<string, Set<string>>()

    for (const trace of schematicTraces) {
      const traceId = trace.schematic_trace_id
      const netKey = (trace as any).subcircuit_connectivity_map_key
      if (!traceId || !netKey) continue

      if (!netKeyToTraceIds.has(netKey)) {
        netKeyToTraceIds.set(netKey, new Set())
      }
      netKeyToTraceIds.get(netKey)?.add(traceId)
    }

    if (netKeyToTraceIds.size === 0) return

    const appliedClasses: Array<{
      traceGroup: SVGGElement
      className: string
    }> = []
    const cssRules: string[] = []

    Array.from(netKeyToTraceIds.entries()).forEach(([, traceIds], netIndex) => {
      const className = `schematic-trace-net-${netIndex}`

      for (const traceId of traceIds) {
        const traceGroups = svg.querySelectorAll<SVGGElement>(
          `[data-schematic-trace-id="${traceId}"]`,
        )
        for (const traceGroup of Array.from(traceGroups)) {
          traceGroup.classList.add(className)
          appliedClasses.push({ traceGroup, className })
        }
      }

      cssRules.push(`
          .${className}:hover,
          svg:has(.${className}:hover) .${className} {
            filter: invert(1);
          }

          .${className}:hover .trace-crossing-outline,
          svg:has(.${className}:hover) .${className} .trace-crossing-outline {
            opacity: 0;
          }
        `)
    })

    const style = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "style",
    )
    style.textContent = cssRules.join("\n")
    svg.prepend(style)

    return () => {
      for (const { traceGroup, className } of appliedClasses) {
        traceGroup.classList.remove(className)
      }
      style.remove()
    }
  }, [svgDivRef, circuitJson, circuitJsonKey, svgString])
}
