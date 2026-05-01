import { useEffect, useRef } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

export const useTraceNetHighlighting = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  const hoveredNetIdRef = useRef<string | null>(null)

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const getNetIdFromElement = (element: Element): string | null => {
      const traceId = element.closest("[data-schematic-trace-id]")?.getAttribute("data-schematic-trace-id")
      if (!traceId) return null

      const trace = su(circuitJson).schematic_trace.get(traceId)
      if (!trace) return null

      // Try to get netId via source_trace_id first
      if (trace.source_trace_id) {
        const sourceTrace = su(circuitJson).source_trace.get(trace.source_trace_id)
        if (sourceTrace?.connected_source_net_ids?.[0]) {
          return sourceTrace.connected_source_net_ids[0]
        }
      }

      // Fallback: find netId via connected ports
      const portId = trace.edges.find(e => e.from_schematic_port_id)?.from_schematic_port_id ||
                     trace.edges.find(e => e.to_schematic_port_id)?.to_schematic_port_id
      
      if (portId) {
        const schematicPort = su(circuitJson).schematic_port.get(portId)
        if (schematicPort?.source_port_id) {
          const sourceTrace = su(circuitJson).source_trace.list().find(st => 
            st.connected_source_port_ids?.includes(schematicPort.source_port_id)
          )
          if (sourceTrace?.connected_source_net_ids?.[0]) {
            return sourceTrace.connected_source_net_ids[0]
          }
        }
      }

      return null
    }

    const highlightNet = (netId: string | null, highlight: boolean) => {
      if (!netId) return

      const sourceTraces = su(circuitJson).source_trace.list().filter(st => 
        st.connected_source_net_ids?.includes(netId)
      )
      const sourceTraceIds = new Set(sourceTraces.map(st => st.source_trace_id))
      
      const schematicTraces = su(circuitJson).schematic_trace.list().filter(st => 
        sourceTraceIds.has(st.source_trace_id)
      )

      schematicTraces.forEach(st => {
        const paths = svgDiv.querySelectorAll(`[data-schematic-trace-id="${st.schematic_trace_id}"] path`)
        paths.forEach(path => {
          const el = path as SVGPathElement
          if (highlight) {
            if (!el.hasAttribute("data-original-stroke")) {
              el.setAttribute("data-original-stroke", el.getAttribute("stroke") || "")
              el.setAttribute("data-original-stroke-width", el.getAttribute("stroke-width") || "")
            }
            el.setAttribute("stroke", "#ffb700")
            const originalWidth = parseFloat(el.getAttribute("data-original-stroke-width") || "0.05")
            el.setAttribute("stroke-width", (originalWidth * 1.5).toString())
          } else {
            const originalStroke = el.getAttribute("data-original-stroke")
            const originalWidth = el.getAttribute("data-original-stroke-width")
            if (originalStroke !== null) el.setAttribute("stroke", originalStroke)
            if (originalWidth !== null) el.setAttribute("stroke-width", originalWidth)
          }
        })
      })
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element
      const netId = getNetIdFromElement(target)
      
      if (netId !== hoveredNetIdRef.current) {
        if (hoveredNetIdRef.current) {
          highlightNet(hoveredNetIdRef.current, false)
        }
        hoveredNetIdRef.current = netId
        if (netId) {
          highlightNet(netId, true)
        }
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.relatedTarget as Element
      if (!target || !svgDiv.contains(target)) {
        if (hoveredNetIdRef.current) {
          highlightNet(hoveredNetIdRef.current, false)
          hoveredNetIdRef.current = null
        }
        return
      }

      const netId = getNetIdFromElement(target)
      if (netId !== hoveredNetIdRef.current) {
        if (hoveredNetIdRef.current) {
          highlightNet(hoveredNetIdRef.current, false)
        }
        hoveredNetIdRef.current = netId
        if (netId) {
          highlightNet(netId, true)
        }
      }
    }

    svgDiv.addEventListener("mouseover", handleMouseOver)
    svgDiv.addEventListener("mouseout", handleMouseOut)

    return () => {
      svgDiv.removeEventListener("mouseover", handleMouseOver)
      svgDiv.removeEventListener("mouseout", handleMouseOut)
      if (hoveredNetIdRef.current) {
        highlightNet(hoveredNetIdRef.current, false)
      }
    }
  }, [svgDivRef, circuitJson])
}
