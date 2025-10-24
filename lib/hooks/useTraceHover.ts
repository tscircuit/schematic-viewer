import { useEffect, useRef } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

export const useTraceHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  const hoveredNetRef = useRef<Set<string> | null>(null)
  const originalStylesRef = useRef<Map<string, { stroke: string; strokeWidth: string }>>(new Map())

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    // Function to get connected traces in the same net
    const getConnectedTraces = (schematicTraceId: string) => {
      const schematicTrace = su(circuitJson).schematic_trace.get(schematicTraceId)
      if (!schematicTrace) return new Set<string>()

      const sourceTrace = su(circuitJson).source_trace.get(schematicTrace.source_trace_id)
      if (!sourceTrace) return new Set<string>()

      // Find all schematic traces with the same source_trace_id (same net)
      const connectedTraces = su(circuitJson)
        .schematic_trace.list()
        .filter(st => st.source_trace_id === sourceTrace.source_trace_id)
        .map(st => st.schematic_trace_id)

      return new Set(connectedTraces)
    }

    // Function to store original styles
    const storeOriginalStyles = (traceIds: Set<string>) => {
      traceIds.forEach(traceId => {
        const traceGroup = svg.querySelector(`[data-schematic-trace-id="${traceId}"]`)
        if (traceGroup) {
          const allElements = traceGroup.querySelectorAll('*')
          allElements.forEach((element: Element) => {
            const key = `${traceId}-${element}`
            if (!originalStylesRef.current.has(key)) {
            originalStylesRef.current.set(key, {
              stroke: element.getAttribute("stroke") || "#000000",
              strokeWidth: element.getAttribute("stroke-width") || "1",
            })
            }
          })
        }
      })
    }

    // Function to apply hover styles
    const applyHoverStyles = (traceIds: Set<string>, isHovering: boolean) => {
      traceIds.forEach(traceId => {
        const traceGroup = svg.querySelector(`[data-schematic-trace-id="${traceId}"]`)
        if (traceGroup) {
          const allElements = traceGroup.querySelectorAll('*')
          allElements.forEach((element: Element) => {
            const key = `${traceId}-${element}`
            if (isHovering) {
              element.setAttribute("stroke", "#ff0000")
              element.setAttribute("stroke-width", "3")
            } else {
              const original = originalStylesRef.current.get(key)
              if (original) {
                element.setAttribute("stroke", original.stroke)
                element.setAttribute("stroke-width", original.strokeWidth)
              }
            }
          })
        }
      })
    }

    // Function to add event listeners
    const addEventListeners = () => {
      const traceElements = svg.querySelectorAll('[data-circuit-json-type="schematic_trace"]')
      traceElements.forEach((element: Element) => {
        const traceId = element.getAttribute('data-schematic-trace-id')
        if (!traceId) return

        const handleMouseEnter = () => {
          const connectedTraces = getConnectedTraces(traceId)
          storeOriginalStyles(connectedTraces)
          hoveredNetRef.current = connectedTraces
          applyHoverStyles(connectedTraces, true)
        }

        const handleMouseLeave = () => {
          if (hoveredNetRef.current) {
            applyHoverStyles(hoveredNetRef.current, false)
            hoveredNetRef.current = null
          }
        }

        element.addEventListener('mouseenter', handleMouseEnter)
        element.addEventListener('mouseleave', handleMouseLeave)
      })
    }

    // Add listeners initially
    addEventListeners()

    // Observer to reapply listeners when SVG changes
    const observer = new MutationObserver(() => {
      addEventListeners()
    })

    observer.observe(svg, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [svgDivRef, circuitJson, circuitJsonKey])
}
