import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { type RefObject, useEffect, useMemo } from "react"

const TRACE_HOVER_CLASS = "schematic-trace-net-hovered"
const SCHEMATIC_TRACE_SELECTOR =
  '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]'

const addConnectionTag = (tags: Set<string>, type: string, value?: string) => {
  if (value) {
    tags.add(`${type}:${value}`)
  }
}

export const useHighlightConnectedSchematicTraces = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
  svgString,
}: {
  svgDivRef: RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  svgString: string
}) => {
  const traceConnectionTagsById = useMemo(() => {
    const traceConnectionTagsById = new Map<string, Set<string>>()

    try {
      const sourceTraceById = new Map(
        su(circuitJson)
          .source_trace.list()
          .map((trace) => [trace.source_trace_id, trace]),
      )

      for (const schematicTrace of su(circuitJson).schematic_trace.list()) {
        const sourceTrace = schematicTrace.source_trace_id
          ? sourceTraceById.get(schematicTrace.source_trace_id)
          : undefined
        const connectionTags = new Set<string>()

        addConnectionTag(
          connectionTags,
          "source_trace",
          schematicTrace.source_trace_id,
        )

        for (const sourceNetId of sourceTrace?.connected_source_net_ids ?? []) {
          addConnectionTag(connectionTags, "source_net", sourceNetId)
        }

        for (const sourcePortId of sourceTrace?.connected_source_port_ids ??
          []) {
          addConnectionTag(connectionTags, "source_port", sourcePortId)
        }

        addConnectionTag(
          connectionTags,
          "subcircuit_connectivity",
          sourceTrace?.subcircuit_connectivity_map_key ??
            schematicTrace.subcircuit_connectivity_map_key,
        )

        if (connectionTags.size === 0) {
          addConnectionTag(
            connectionTags,
            "schematic_trace",
            schematicTrace.schematic_trace_id,
          )
        }

        traceConnectionTagsById.set(
          schematicTrace.schematic_trace_id,
          connectionTags,
        )
      }
    } catch (err) {
      console.error("Failed to derive schematic trace connection tags", err)
    }

    return traceConnectionTagsById
  }, [circuitJsonKey, circuitJson])

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const traceGroups = Array.from(
      svg.querySelectorAll<SVGGElement>(SCHEMATIC_TRACE_SELECTOR),
    )

    const traceGroupsById = new Map<string, SVGGElement[]>()
    const traceIdsByConnectionTag = new Map<string, Set<string>>()

    for (const traceGroup of traceGroups) {
      const traceId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!traceId) continue

      const existingTraceGroups = traceGroupsById.get(traceId) ?? []
      existingTraceGroups.push(traceGroup)
      traceGroupsById.set(traceId, existingTraceGroups)

      for (const connectionTag of traceConnectionTagsById.get(traceId) ?? []) {
        const existingTraceIds =
          traceIdsByConnectionTag.get(connectionTag) ?? new Set<string>()
        existingTraceIds.add(traceId)
        traceIdsByConnectionTag.set(connectionTag, existingTraceIds)
      }
    }

    const clearTraceHighlights = () => {
      for (const traceGroup of traceGroups) {
        traceGroup.classList.remove(TRACE_HOVER_CLASS)
      }
    }

    const highlightConnectedTraces = (traceId: string) => {
      const pendingTraceIds = [traceId]
      const highlightedTraceIds = new Set<string>()
      const visitedConnectionTags = new Set<string>()

      while (pendingTraceIds.length > 0) {
        const currentTraceId = pendingTraceIds.pop()
        if (!currentTraceId || highlightedTraceIds.has(currentTraceId)) {
          continue
        }

        highlightedTraceIds.add(currentTraceId)

        for (const connectionTag of traceConnectionTagsById.get(
          currentTraceId,
        ) ?? []) {
          if (visitedConnectionTags.has(connectionTag)) {
            continue
          }

          visitedConnectionTags.add(connectionTag)
          for (const connectedTraceId of traceIdsByConnectionTag.get(
            connectionTag,
          ) ?? []) {
            pendingTraceIds.push(connectedTraceId)
          }
        }
      }

      for (const highlightedTraceId of highlightedTraceIds) {
        for (const traceGroup of traceGroupsById.get(highlightedTraceId) ??
          []) {
          traceGroup.classList.add(TRACE_HOVER_CLASS)
        }
      }
    }

    const listeners: Array<{
      traceGroup: SVGGElement
      handlePointerEnter: () => void
      handlePointerLeave: () => void
    }> = []

    for (const traceGroup of traceGroups) {
      const traceId = traceGroup.getAttribute("data-schematic-trace-id")
      if (!traceId) continue

      const handlePointerEnter = () => {
        clearTraceHighlights()
        highlightConnectedTraces(traceId)
      }
      const handlePointerLeave = clearTraceHighlights

      traceGroup.addEventListener("pointerenter", handlePointerEnter)
      traceGroup.addEventListener("pointerleave", handlePointerLeave)
      listeners.push({ traceGroup, handlePointerEnter, handlePointerLeave })
    }

    return () => {
      clearTraceHighlights()
      for (const {
        traceGroup,
        handlePointerEnter,
        handlePointerLeave,
      } of listeners) {
        traceGroup.removeEventListener("pointerenter", handlePointerEnter)
        traceGroup.removeEventListener("pointerleave", handlePointerLeave)
      }
    }
  }, [svgDivRef, svgString, traceConnectionTagsById])
}
