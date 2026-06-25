import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo, useRef } from "react"

const TRACE_HOVER_STROKE = "rgb(255, 132, 0)"

const getVisibleTracePaths = (traceGroup: Element) =>
  Array.from(traceGroup.querySelectorAll("path")).filter((path) => {
    const className = path.getAttribute("class") ?? ""
    return !className.includes("invisible")
  }) as SVGPathElement[]

const getTraceGroup = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null

  return target.closest(
    '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
  )
}

export const useHighlightConnectedSchematicTracesOnHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
  enabled = true,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  enabled?: boolean
}) => {
  const activeTraceIdsRef = useRef<string[]>([])

  const traceIdsBySourceTraceId = useMemo(() => {
    const traceIdsBySourceTraceId = new Map<string, string[]>()

    try {
      for (const trace of su(circuitJson).schematic_trace.list()) {
        const schematicTraceId = trace.schematic_trace_id
        const sourceTraceId = trace.source_trace_id

        if (!schematicTraceId || !sourceTraceId) continue

        const traceIds = traceIdsBySourceTraceId.get(sourceTraceId) ?? []
        traceIds.push(schematicTraceId)
        traceIdsBySourceTraceId.set(sourceTraceId, traceIds)
      }
    } catch (err) {
      console.error("Failed to derive connected schematic traces", err)
    }

    return traceIdsBySourceTraceId
  }, [circuitJson, circuitJsonKey])

  const sourceTraceIdsBySourceNetId = useMemo(() => {
    const sourceTraceIdsBySourceNetId = new Map<string, string[]>()

    try {
      for (const trace of su(circuitJson).source_trace.list()) {
        if (!trace.source_trace_id) continue

        for (const sourceNetId of trace.connected_source_net_ids ?? []) {
          const sourceTraceIds =
            sourceTraceIdsBySourceNetId.get(sourceNetId) ?? []
          sourceTraceIds.push(trace.source_trace_id)
          sourceTraceIdsBySourceNetId.set(sourceNetId, sourceTraceIds)
        }
      }
    } catch (err) {
      console.error("Failed to derive source trace nets", err)
    }

    return sourceTraceIdsBySourceNetId
  }, [circuitJson, circuitJsonKey])

  const sourceNetIdsBySourceTraceId = useMemo(() => {
    const sourceNetIdsBySourceTraceId = new Map<string, string[]>()

    try {
      for (const trace of su(circuitJson).source_trace.list()) {
        if (!trace.source_trace_id) continue

        sourceNetIdsBySourceTraceId.set(
          trace.source_trace_id,
          trace.connected_source_net_ids ?? [],
        )
      }
    } catch (err) {
      console.error("Failed to derive source trace net ids", err)
    }

    return sourceNetIdsBySourceTraceId
  }, [circuitJson, circuitJsonKey])

  const sourceTraceIdByTraceId = useMemo(() => {
    const sourceTraceIdByTraceId = new Map<string, string>()

    for (const [sourceTraceId, traceIds] of traceIdsBySourceTraceId) {
      for (const traceId of traceIds) {
        sourceTraceIdByTraceId.set(traceId, sourceTraceId)
      }
    }

    return sourceTraceIdByTraceId
  }, [traceIdsBySourceTraceId])

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv || !enabled) return

    const resetHighlightedTraces = () => {
      for (const traceId of activeTraceIdsRef.current) {
        const traceGroup = svgDiv.querySelector(
          `[data-schematic-trace-id="${traceId}"]`,
        )
        if (!traceGroup) continue

        for (const path of getVisibleTracePaths(traceGroup)) {
          const originalStroke = path.dataset.originalTraceStroke
          if (originalStroke) {
            path.setAttribute("stroke", originalStroke)
            delete path.dataset.originalTraceStroke
          }
          path.style.filter = ""
        }
      }

      activeTraceIdsRef.current = []
    }

    const highlightTraces = (traceIds: string[]) => {
      resetHighlightedTraces()

      activeTraceIdsRef.current = traceIds

      for (const traceId of traceIds) {
        const traceGroup = svgDiv.querySelector(
          `[data-schematic-trace-id="${traceId}"]`,
        )
        if (!traceGroup) continue

        for (const path of getVisibleTracePaths(traceGroup)) {
          path.dataset.originalTraceStroke = path.getAttribute("stroke") ?? ""
          path.setAttribute("stroke", TRACE_HOVER_STROKE)
          path.style.filter = "drop-shadow(0 0 3px rgba(255, 132, 0, 0.55))"
        }
      }
    }

    const handlePointerOver = (event: PointerEvent) => {
      const traceGroup = getTraceGroup(event.target)
      const schematicTraceId = traceGroup?.getAttribute(
        "data-schematic-trace-id",
      )

      if (!schematicTraceId) return

      const sourceTraceId = sourceTraceIdByTraceId.get(schematicTraceId)
      const sourceNetIds = sourceTraceId
        ? sourceNetIdsBySourceTraceId.get(sourceTraceId)
        : null
      const connectedSourceTraceIds = new Set<string>(
        sourceTraceId ? [sourceTraceId] : [],
      )

      for (const sourceNetId of sourceNetIds ?? []) {
        for (const connectedSourceTraceId of sourceTraceIdsBySourceNetId.get(
          sourceNetId,
        ) ?? []) {
          connectedSourceTraceIds.add(connectedSourceTraceId)
        }
      }

      const connectedTraceIds = Array.from(connectedSourceTraceIds).flatMap(
        (connectedSourceTraceId) =>
          traceIdsBySourceTraceId.get(connectedSourceTraceId) ?? [],
      )

      highlightTraces(
        connectedTraceIds.length > 0 ? connectedTraceIds : [schematicTraceId],
      )
    }

    const handlePointerOut = (event: PointerEvent) => {
      const traceGroup = getTraceGroup(event.target)
      if (!traceGroup) return

      const relatedTraceGroup = getTraceGroup(event.relatedTarget)
      if (relatedTraceGroup === traceGroup) return

      resetHighlightedTraces()
    }

    svgDiv.addEventListener("pointerover", handlePointerOver)
    svgDiv.addEventListener("pointerout", handlePointerOut)

    return () => {
      svgDiv.removeEventListener("pointerover", handlePointerOver)
      svgDiv.removeEventListener("pointerout", handlePointerOut)
      resetHighlightedTraces()
    }
  }, [
    svgDivRef,
    enabled,
    sourceNetIdsBySourceTraceId,
    sourceTraceIdByTraceId,
    sourceTraceIdsBySourceNetId,
    traceIdsBySourceTraceId,
  ])
}
