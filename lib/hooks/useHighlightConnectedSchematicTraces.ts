import type { CircuitJson } from "circuit-json"
import { type RefObject, useEffect } from "react"

export const HOVERED_TRACE_CLASS = "schematic-trace-net-hover"

export function useHighlightConnectedSchematicTraces({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
  svgString,
}: {
  svgDivRef: RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  svgString: string
}) {
  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const traceGroups = Array.from(
      svgDiv.querySelectorAll<SVGGElement>(
        '.trace[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      ),
    )
    if (traceGroups.length === 0) return

    const schematicTraces = circuitJson.filter(isSchematicTrace)
    const netKeyByTraceId = getNetKeyByTraceId(schematicTraces)
    if (netKeyByTraceId.size === 0) return

    const clearHoveredTraces = () => {
      for (const group of traceGroups) {
        group.classList.remove(HOVERED_TRACE_CLASS)
      }
    }

    const cleanupFns: Array<() => void> = []
    for (const group of traceGroups) {
      const traceId = group.dataset.schematicTraceId
      const netKey = traceId ? netKeyByTraceId.get(traceId) : undefined
      if (!netKey) continue

      const onMouseEnter = () => {
        clearHoveredTraces()
        for (const candidate of traceGroups) {
          const candidateTraceId = candidate.dataset.schematicTraceId
          if (
            candidateTraceId &&
            netKeyByTraceId.get(candidateTraceId) === netKey
          ) {
            candidate.classList.add(HOVERED_TRACE_CLASS)
          }
        }
      }

      group.addEventListener("mouseenter", onMouseEnter)
      group.addEventListener("mouseleave", clearHoveredTraces)
      cleanupFns.push(() => {
        group.removeEventListener("mouseenter", onMouseEnter)
        group.removeEventListener("mouseleave", clearHoveredTraces)
      })
    }

    return () => {
      clearHoveredTraces()
      for (const cleanup of cleanupFns) cleanup()
    }
  }, [svgDivRef, circuitJson, circuitJsonKey, svgString])
}

function isSchematicTrace(
  element: CircuitJson[number],
): element is Extract<CircuitJson[number], { type: "schematic_trace" }> {
  return element.type === "schematic_trace"
}

function getNetKeyByTraceId(
  schematicTraces: Array<
    Extract<CircuitJson[number], { type: "schematic_trace" }>
  >,
): Map<string, string> {
  const netKeyByTraceId = new Map<string, string>()
  const tracesWithoutNetKey: typeof schematicTraces = []

  for (const trace of schematicTraces) {
    const traceId = trace.schematic_trace_id
    if (!traceId) continue

    const explicitNetKey = (trace as any).subcircuit_connectivity_map_key
    if (explicitNetKey) {
      netKeyByTraceId.set(traceId, explicitNetKey)
    } else {
      tracesWithoutNetKey.push(trace)
    }
  }

  const parent = new Map<string, string>()
  const find = (traceId: string): string => {
    const currentParent = parent.get(traceId) ?? traceId
    if (currentParent === traceId) return traceId
    const root = find(currentParent)
    parent.set(traceId, root)
    return root
  }
  const union = (a: string, b: string) => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent.set(rootB, rootA)
  }

  const traceIdsByPoint = new Map<string, string[]>()
  for (const trace of tracesWithoutNetKey) {
    const traceId = trace.schematic_trace_id
    if (!traceId) continue
    parent.set(traceId, traceId)

    for (const edge of trace.edges ?? []) {
      for (const point of [edge.from, edge.to]) {
        const pointKey = `${roundPoint(point.x)},${roundPoint(point.y)}`
        const traceIds = traceIdsByPoint.get(pointKey) ?? []
        for (const connectedTraceId of traceIds) {
          union(traceId, connectedTraceId)
        }
        traceIds.push(traceId)
        traceIdsByPoint.set(pointKey, traceIds)
      }
    }
  }

  for (const trace of tracesWithoutNetKey) {
    const traceId = trace.schematic_trace_id
    if (!traceId) continue
    netKeyByTraceId.set(traceId, `connected:${find(traceId)}`)
  }

  return netKeyByTraceId
}

function roundPoint(value: number): string {
  return value.toFixed(6)
}
