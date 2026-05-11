import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo } from "react"

interface UseHighlightSchematicTracesOnHoverOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}

export const useHighlightSchematicTracesOnHover = ({
  svgDivRef,
  circuitJson,
}: UseHighlightSchematicTracesOnHoverOptions) => {
  const relatedTraceIdsBySchematicTraceId = useMemo(() => {
    try {
      const schematicTraces = su(circuitJson).schematic_trace?.list() ?? []
      const sourceTraces = su(circuitJson).source_trace?.list() ?? []

      const sourceTraceById = new Map(
        sourceTraces.map((sourceTrace) => [
          sourceTrace.source_trace_id,
          sourceTrace,
        ]),
      )

      const schematicTraceIdsByNetId = new Map<string, Set<string>>()

      for (const schematicTrace of schematicTraces) {
        if (!schematicTrace.source_trace_id) continue

        const sourceTrace = sourceTraceById.get(schematicTrace.source_trace_id)
        const netIds = sourceTrace?.connected_source_net_ids ?? []

        if (netIds.length === 0) continue

        for (const netId of netIds) {
          if (!schematicTraceIdsByNetId.has(netId)) {
            schematicTraceIdsByNetId.set(netId, new Set())
          }
          schematicTraceIdsByNetId
            .get(netId)!
            .add(schematicTrace.schematic_trace_id)
        }
      }

      const relatedTraceIds = new Map<string, string[]>()

      for (const schematicTrace of schematicTraces) {
        if (!schematicTrace.source_trace_id) continue

        const sourceTrace = sourceTraceById.get(schematicTrace.source_trace_id)
        const netIds = sourceTrace?.connected_source_net_ids ?? []

        if (netIds.length === 0) continue

        const peerTraceIds = new Set<string>()

        for (const netId of netIds) {
          for (const peerTraceId of schematicTraceIdsByNetId.get(netId) ?? []) {
            peerTraceIds.add(peerTraceId)
          }
        }

        if (peerTraceIds.size > 0) {
          relatedTraceIds.set(
            schematicTrace.schematic_trace_id,
            Array.from(peerTraceIds),
          )
        }
      }

      return relatedTraceIds
    } catch (error) {
      console.error("Failed to derive same-net schematic trace groups", error)
      return new Map<string, string[]>()
    }
  }, [circuitJson])

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv || relatedTraceIdsBySchematicTraceId.size === 0) return

    let activeTraceIds: string[] = []
    let activeSchematicTraceId: string | null = null

    const getTraceGroupById = (traceId: string) => {
      const escapedTraceId =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(traceId)
          : traceId

      return svgDiv.querySelector<HTMLElement>(
        `[data-schematic-trace-id="${escapedTraceId}"]`,
      )
    }

    const clearActiveHighlight = () => {
      for (const traceId of activeTraceIds) {
        const traceGroup = getTraceGroupById(traceId)
        if (traceGroup) {
          traceGroup.style.filter = ""
        }
      }
      activeTraceIds = []
      activeSchematicTraceId = null
    }

    const getTraceGroup = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null
      return target.closest<HTMLElement>(
        '[data-circuit-json-type="schematic_trace"]',
      )
    }

    const setActiveHighlight = (schematicTraceId: string | null) => {
      if (!schematicTraceId) {
        clearActiveHighlight()
        return
      }

      if (activeSchematicTraceId === schematicTraceId) return

      clearActiveHighlight()

      const relatedTraceIds =
        relatedTraceIdsBySchematicTraceId.get(schematicTraceId)
      if (!relatedTraceIds) return

      for (const traceId of relatedTraceIds) {
        const traceGroup = getTraceGroupById(traceId)
        if (traceGroup) {
          traceGroup.style.filter = "invert(1)"
        }
      }

      activeTraceIds = relatedTraceIds
      activeSchematicTraceId = schematicTraceId
    }

    const handleMouseOver = (event: MouseEvent) => {
      const traceGroup = getTraceGroup(event.target)
      if (!traceGroup) return

      const schematicTraceId = traceGroup.getAttribute(
        "data-schematic-trace-id",
      )
      if (!schematicTraceId) return

      if (!relatedTraceIdsBySchematicTraceId.has(schematicTraceId)) return

      setActiveHighlight(schematicTraceId)
    }

    const handleMouseOut = (event: MouseEvent) => {
      const traceGroup = getTraceGroup(event.target)
      if (!traceGroup) return

      const nextTraceGroup = getTraceGroup(event.relatedTarget)
      const nextSchematicTraceId =
        nextTraceGroup?.getAttribute("data-schematic-trace-id") ?? null

      if (
        nextSchematicTraceId &&
        relatedTraceIdsBySchematicTraceId.has(nextSchematicTraceId)
      ) {
        setActiveHighlight(nextSchematicTraceId)
        return
      }

      clearActiveHighlight()
    }

    svgDiv.addEventListener("mouseover", handleMouseOver)
    svgDiv.addEventListener("mouseout", handleMouseOut)

    return () => {
      clearActiveHighlight()
      svgDiv.removeEventListener("mouseover", handleMouseOver)
      svgDiv.removeEventListener("mouseout", handleMouseOut)
    }
  }, [relatedTraceIdsBySchematicTraceId, svgDivRef])
}
