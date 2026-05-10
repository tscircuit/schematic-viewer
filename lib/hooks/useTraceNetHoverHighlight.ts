import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo, useRef } from "react"

const HOVER_STROKE = "#ffb700"

const getCircuitJsonHash = (circuitJson: CircuitJson) => {
  return `${circuitJson?.length || 0}_${(circuitJson as any)?.editCount || 0}`
}

/**
 * Highlight every visible schematic trace segment that belongs to the same
 * source trace/net as the hovered segment.
 */
export const useTraceNetHoverHighlight = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  const originalStrokeByPathRef = useRef<
    WeakMap<SVGPathElement, string | null>
  >(new WeakMap())
  const activeSourceTraceIdRef = useRef<string | null>(null)
  const circuitJsonHash = useMemo(
    () => getCircuitJsonHash(circuitJson),
    [circuitJson],
  )

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const schematicTraceIdToSourceTraceId = new Map<string, string>()
    const sourceTraceIdToSchematicTraceIds = new Map<string, Set<string>>()

    for (const elm of circuitJson as any[]) {
      if (elm?.type !== "schematic_trace") continue
      const schematicTraceId = elm.schematic_trace_id
      const sourceTraceId = elm.source_trace_id
      if (!schematicTraceId || !sourceTraceId) continue

      schematicTraceIdToSourceTraceId.set(schematicTraceId, sourceTraceId)
      const schematicTraceIds =
        sourceTraceIdToSchematicTraceIds.get(sourceTraceId) ?? new Set<string>()
      schematicTraceIds.add(schematicTraceId)
      sourceTraceIdToSchematicTraceIds.set(sourceTraceId, schematicTraceIds)
    }

    const getTraceContainer = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null
      return target.closest<SVGElement>("[data-schematic-trace-id]")
    }

    const getSourceTraceIdForTarget = (target: EventTarget | null) => {
      const traceContainer = getTraceContainer(target)
      const schematicTraceId = traceContainer?.getAttribute(
        "data-schematic-trace-id",
      )
      if (!schematicTraceId) return null
      return schematicTraceIdToSourceTraceId.get(schematicTraceId) ?? null
    }

    const forEachPathInSourceTrace = (
      sourceTraceId: string,
      callback: (path: SVGPathElement) => void,
    ) => {
      const schematicTraceIds =
        sourceTraceIdToSchematicTraceIds.get(sourceTraceId)
      if (!schematicTraceIds) return

      for (const traceElement of Array.from(
        svg.querySelectorAll<SVGElement>("[data-schematic-trace-id]"),
      )) {
        const schematicTraceId = traceElement.getAttribute(
          "data-schematic-trace-id",
        )
        if (!schematicTraceId || !schematicTraceIds.has(schematicTraceId)) {
          continue
        }

        for (const path of Array.from(
          traceElement.querySelectorAll<SVGPathElement>("path"),
        )) {
          if (path.getAttribute("class")?.includes("invisible")) continue
          callback(path)
        }
      }
    }

    const clearHighlight = () => {
      const sourceTraceId = activeSourceTraceIdRef.current
      if (!sourceTraceId) return

      forEachPathInSourceTrace(sourceTraceId, (path) => {
        const originalStroke = originalStrokeByPathRef.current.get(path)
        if (originalStroke === null) {
          path.removeAttribute("stroke")
        } else if (originalStroke !== undefined) {
          path.setAttribute("stroke", originalStroke)
        }
      })

      activeSourceTraceIdRef.current = null
    }

    const applyHighlight = (sourceTraceId: string) => {
      if (activeSourceTraceIdRef.current === sourceTraceId) return
      clearHighlight()
      activeSourceTraceIdRef.current = sourceTraceId

      forEachPathInSourceTrace(sourceTraceId, (path) => {
        if (!originalStrokeByPathRef.current.has(path)) {
          originalStrokeByPathRef.current.set(path, path.getAttribute("stroke"))
        }
        path.setAttribute("stroke", HOVER_STROKE)
      })
    }

    const handleMouseOver = (event: MouseEvent) => {
      const sourceTraceId = getSourceTraceIdForTarget(event.target)
      if (!sourceTraceId) return
      applyHighlight(sourceTraceId)
    }

    const handleMouseOut = (event: MouseEvent) => {
      const sourceTraceId = getSourceTraceIdForTarget(event.target)
      if (!sourceTraceId) return

      const nextSourceTraceId = getSourceTraceIdForTarget(event.relatedTarget)
      if (nextSourceTraceId === sourceTraceId) return

      clearHighlight()
    }

    svg.addEventListener("mouseover", handleMouseOver)
    svg.addEventListener("mouseout", handleMouseOut)

    return () => {
      svg.removeEventListener("mouseover", handleMouseOver)
      svg.removeEventListener("mouseout", handleMouseOut)
      clearHighlight()
    }
  }, [svgDivRef, circuitJsonHash, circuitJson])
}
