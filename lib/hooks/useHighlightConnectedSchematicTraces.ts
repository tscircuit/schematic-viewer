import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo } from "react"
import { su } from "@tscircuit/soup-util"

const HOVERED_TRACE_CLASS = "schematic-trace-hovered"

export const useHighlightConnectedSchematicTraces = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  const schematicTraceIdsByConnectionKey = useMemo(() => {
    const idsByConnectionKey = new Map<string, Set<string>>()

    try {
      const sourceTracesById = new Map(
        su(circuitJson)
          .source_trace.list()
          .map((sourceTrace) => [sourceTrace.source_trace_id, sourceTrace]),
      )

      for (const schematicTrace of su(circuitJson).schematic_trace.list()) {
        if (
          !schematicTrace.schematic_trace_id ||
          !schematicTrace.source_trace_id
        ) {
          continue
        }

        const sourceTrace = sourceTracesById.get(schematicTrace.source_trace_id)
        const connectedNetIds = sourceTrace?.connected_source_net_ids ?? []
        const connectionKey =
          connectedNetIds.length > 0
            ? `source-net:${[...connectedNetIds].sort().join(",")}`
            : `source-trace:${schematicTrace.source_trace_id}`

        const traceIds = idsByConnectionKey.get(connectionKey) ?? new Set()
        traceIds.add(schematicTrace.schematic_trace_id)
        idsByConnectionKey.set(connectionKey, traceIds)
      }
    } catch (err) {
      console.error("Failed to derive connected schematic trace ids", err)
    }

    return idsByConnectionKey
  }, [circuitJsonKey, circuitJson])

  const connectionKeyBySchematicTraceId = useMemo(() => {
    const connectionKeyByTraceId = new Map<string, string>()

    for (const [
      connectionKey,
      schematicTraceIds,
    ] of schematicTraceIdsByConnectionKey.entries()) {
      for (const schematicTraceId of schematicTraceIds) {
        connectionKeyByTraceId.set(schematicTraceId, connectionKey)
      }
    }

    return connectionKeyByTraceId
  }, [schematicTraceIdsByConnectionKey])

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const clearHoveredTraces = () => {
      for (const trace of Array.from(
        svgDiv.querySelectorAll(`.${HOVERED_TRACE_CLASS}`),
      )) {
        trace.classList.remove(HOVERED_TRACE_CLASS)
      }
    }

    const setHoveredTraceGroup = (schematicTraceId: string | null) => {
      clearHoveredTraces()
      if (!schematicTraceId) return

      const connectionKey =
        connectionKeyBySchematicTraceId.get(schematicTraceId)
      if (!connectionKey) return

      const schematicTraceIds =
        schematicTraceIdsByConnectionKey.get(connectionKey) ?? new Set()

      for (const connectedSchematicTraceId of schematicTraceIds) {
        const connectedTrace = svgDiv.querySelector(
          `[data-schematic-trace-id="${connectedSchematicTraceId}"]`,
        )
        connectedTrace?.classList.add(HOVERED_TRACE_CLASS)
      }
    }

    const getTraceIdFromEvent = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return null

      const traceElement = target.closest("[data-schematic-trace-id]")
      return traceElement?.getAttribute("data-schematic-trace-id") ?? null
    }

    const handleMouseOver = (event: MouseEvent) => {
      setHoveredTraceGroup(getTraceIdFromEvent(event))
    }

    const handleMouseOut = (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget
      if (relatedTarget instanceof Element) {
        const nextTraceId =
          relatedTarget
            .closest("[data-schematic-trace-id]")
            ?.getAttribute("data-schematic-trace-id") ?? null

        if (nextTraceId) {
          setHoveredTraceGroup(nextTraceId)
          return
        }
      }

      clearHoveredTraces()
    }

    svgDiv.addEventListener("mouseover", handleMouseOver)
    svgDiv.addEventListener("mouseout", handleMouseOut)

    return () => {
      svgDiv.removeEventListener("mouseover", handleMouseOver)
      svgDiv.removeEventListener("mouseout", handleMouseOut)
      clearHoveredTraces()
    }
  }, [
    svgDivRef,
    connectionKeyBySchematicTraceId,
    schematicTraceIdsByConnectionKey,
  ])
}
