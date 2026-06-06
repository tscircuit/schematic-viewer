import { useEffect, useMemo } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

export const useHighlightConnectedSchematicTraces = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  const traceIdsByGroupKey = useMemo(() => {
    const groups = new Map<string, string[]>()

    try {
      for (const trace of su(circuitJson).schematic_trace.list()) {
        const traceId = trace.schematic_trace_id
        if (!traceId) continue

        const groupKey =
          (trace as any).source_net_id ?? trace.source_trace_id ?? traceId
        const traceIds = groups.get(groupKey) ?? []
        traceIds.push(traceId)
        groups.set(groupKey, traceIds)
      }
    } catch (err) {
      console.error("Failed to derive connected schematic trace groups", err)
    }

    return groups
  }, [circuitJson, circuitJsonKey])

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg || traceIdsByGroupKey.size === 0) return

    const groupKeyByTraceId = new Map<string, string>()
    for (const [groupKey, traceIds] of traceIdsByGroupKey) {
      for (const traceId of traceIds) {
        groupKeyByTraceId.set(traceId, groupKey)
      }
    }

    const highlightedElements = new Set<Element>()

    const clearHighlight = () => {
      for (const element of highlightedElements) {
        element.classList.remove("schematic-trace-net-hover")
      }
      highlightedElements.clear()
    }

    const highlightTraceGroup = (traceId: string) => {
      const groupKey = groupKeyByTraceId.get(traceId)
      if (!groupKey) return

      clearHighlight()

      for (const connectedTraceId of traceIdsByGroupKey.get(groupKey) ?? []) {
        const traceElement = svg.querySelector(
          `[data-schematic-trace-id="${connectedTraceId}"]`,
        )
        if (!traceElement) continue
        traceElement.classList.add("schematic-trace-net-hover")
        highlightedElements.add(traceElement)
      }
    }

    const cleanupFns: Array<() => void> = []

    for (const traceId of groupKeyByTraceId.keys()) {
      const traceElement = svg.querySelector(
        `[data-schematic-trace-id="${traceId}"]`,
      )
      if (!traceElement) continue

      const handlePointerEnter = () => highlightTraceGroup(traceId)
      const handlePointerLeave = () => clearHighlight()

      traceElement.addEventListener("pointerenter", handlePointerEnter)
      traceElement.addEventListener("pointerleave", handlePointerLeave)

      cleanupFns.push(() => {
        traceElement.removeEventListener("pointerenter", handlePointerEnter)
        traceElement.removeEventListener("pointerleave", handlePointerLeave)
      })
    }

    return () => {
      for (const cleanup of cleanupFns) cleanup()
      clearHighlight()
    }
  }, [svgDivRef, traceIdsByGroupKey])
}
