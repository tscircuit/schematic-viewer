import { useEffect, useMemo, useRef } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

const HOVERED_TRACE_CLASS = "same-net-trace-hovered"

const getTraceGroupFromTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null
  return target.closest<SVGGElement>(
    '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
  )
}

const getTraceId = (traceGroup: Element | null) => {
  return traceGroup?.getAttribute("data-schematic-trace-id") ?? null
}

class UnionFind {
  parent = new Map<string, string>()

  find(id: string): string {
    if (!this.parent.has(id)) {
      this.parent.set(id, id)
      return id
    }

    const parentId = this.parent.get(id)!
    if (parentId === id) return id

    const root = this.find(parentId)
    this.parent.set(id, root)
    return root
  }

  union(a: string, b: string) {
    const rootA = this.find(a)
    const rootB = this.find(b)

    if (rootA !== rootB) {
      this.parent.set(rootB, rootA)
    }
  }
}

export const useHighlightConnectedSchematicTraces = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  const highlightedTraceIdsRef = useRef<Set<string>>(new Set())

  const connectedTraceIdsByTraceId = useMemo(() => {
    const traceIdsByGroupId = new Map<string, Set<string>>()
    const groupIdByTraceId = new Map<string, string>()

    try {
      const unionFind = new UnionFind()
      const sourceTraces = su(circuitJson).source_trace.list()

      for (const sourceTrace of sourceTraces) {
        const sourceTraceId = sourceTrace.source_trace_id
        if (!sourceTraceId) continue

        const sourceTraceNodeId = `source_trace:${sourceTraceId}`
        unionFind.find(sourceTraceNodeId)

        const connectedSourcePortIds =
          sourceTrace.connected_source_port_ids ?? []
        const connectedSourceNetIds = sourceTrace.connected_source_net_ids ?? []

        for (const sourcePortId of connectedSourcePortIds) {
          unionFind.union(sourceTraceNodeId, `source_port:${sourcePortId}`)
        }

        for (const sourceNetId of connectedSourceNetIds) {
          unionFind.union(sourceTraceNodeId, `source_net:${sourceNetId}`)
        }
      }

      const schematicTraces = su(circuitJson).schematic_trace.list()

      for (const schematicTrace of schematicTraces) {
        const schematicTraceId = schematicTrace.schematic_trace_id
        if (!schematicTraceId) continue

        const groupId = schematicTrace.source_trace_id
          ? unionFind.find(`source_trace:${schematicTrace.source_trace_id}`)
          : `schematic_trace:${schematicTraceId}`

        groupIdByTraceId.set(schematicTraceId, groupId)

        const traceIds = traceIdsByGroupId.get(groupId) ?? new Set<string>()
        traceIds.add(schematicTraceId)
        traceIdsByGroupId.set(groupId, traceIds)
      }
    } catch (err) {
      console.error("Failed to derive connected schematic traces", err)
    }

    const connectedTraceIdsByTraceId = new Map<string, Set<string>>()

    for (const [traceId, groupId] of groupIdByTraceId) {
      connectedTraceIdsByTraceId.set(
        traceId,
        traceIdsByGroupId.get(groupId) ?? new Set([traceId]),
      )
    }

    return connectedTraceIdsByTraceId
  }, [circuitJsonKey, circuitJson])

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const clearHighlightedTraces = () => {
      if (highlightedTraceIdsRef.current.size === 0) return

      for (const traceId of highlightedTraceIdsRef.current) {
        svg
          .querySelector(
            `[data-circuit-json-type="schematic_trace"][data-schematic-trace-id="${traceId}"]`,
          )
          ?.classList.remove(HOVERED_TRACE_CLASS)
      }

      highlightedTraceIdsRef.current.clear()
    }

    const highlightConnectedTraces = (traceId: string | null) => {
      clearHighlightedTraces()

      if (!traceId) return

      const connectedTraceIds =
        connectedTraceIdsByTraceId.get(traceId) ?? new Set([traceId])

      for (const connectedTraceId of connectedTraceIds) {
        svg
          .querySelector(
            `[data-circuit-json-type="schematic_trace"][data-schematic-trace-id="${connectedTraceId}"]`,
          )
          ?.classList.add(HOVERED_TRACE_CLASS)
      }

      highlightedTraceIdsRef.current = new Set(connectedTraceIds)
    }

    const handlePointerOver = (event: PointerEvent) => {
      highlightConnectedTraces(
        getTraceId(getTraceGroupFromTarget(event.target)),
      )
    }

    const handlePointerOut = (event: PointerEvent) => {
      const currentTraceGroup = getTraceGroupFromTarget(event.target)
      const nextTraceGroup = getTraceGroupFromTarget(event.relatedTarget)

      if (currentTraceGroup && currentTraceGroup === nextTraceGroup) {
        return
      }

      if (!nextTraceGroup) {
        clearHighlightedTraces()
        return
      }

      highlightConnectedTraces(getTraceId(nextTraceGroup))
    }

    svg.addEventListener("pointerover", handlePointerOver)
    svg.addEventListener("pointerout", handlePointerOut)
    svg.addEventListener("pointerleave", clearHighlightedTraces)

    return () => {
      clearHighlightedTraces()
      svg.removeEventListener("pointerover", handlePointerOver)
      svg.removeEventListener("pointerout", handlePointerOut)
      svg.removeEventListener("pointerleave", clearHighlightedTraces)
    }
  }, [svgDivRef, connectedTraceIdsByTraceId])
}
