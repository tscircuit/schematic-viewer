import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo } from "react"

const HOVERED_NET_CLASS = "schematic-trace-net-hovered"

const escapeCssAttributeValue = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

export const useHighlightConnectedSchematicTraces = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
  svgContentKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  svgContentKey: string
}) => {
  const schematicTraceIdsBySourceTraceId = useMemo(() => {
    const map = new Map<string, string[]>()

    try {
      for (const schematicTrace of su(circuitJson).schematic_trace.list()) {
        const sourceTraceId = schematicTrace.source_trace_id
        if (!sourceTraceId) continue

        const ids = map.get(sourceTraceId) ?? []
        ids.push(schematicTrace.schematic_trace_id)
        map.set(sourceTraceId, ids)
      }
    } catch (err) {
      console.error("Failed to derive schematic trace source map", err)
    }

    return map
  }, [circuitJsonKey, circuitJson])

  const sourceTraceIdsByNetId = useMemo(() => {
    const map = new Map<string, string[]>()

    try {
      for (const sourceTrace of su(circuitJson).source_trace.list()) {
        for (const sourceNetId of sourceTrace.connected_source_net_ids ?? []) {
          const ids = map.get(sourceNetId) ?? []
          ids.push(sourceTrace.source_trace_id)
          map.set(sourceNetId, ids)
        }
      }
    } catch (err) {
      console.error("Failed to derive source trace net map", err)
    }

    return map
  }, [circuitJsonKey, circuitJson])

  const sourceTraceById = useMemo(() => {
    const map = new Map<string, { connected_source_net_ids?: string[] }>()

    try {
      for (const sourceTrace of su(circuitJson).source_trace.list()) {
        map.set(sourceTrace.source_trace_id, sourceTrace)
      }
    } catch (err) {
      console.error("Failed to derive source trace lookup", err)
    }

    return map
  }, [circuitJsonKey, circuitJson])

  const sourceTraceIdBySchematicTraceId = useMemo(() => {
    const map = new Map<string, string>()

    for (const [
      sourceTraceId,
      schematicTraceIds,
    ] of schematicTraceIdsBySourceTraceId) {
      for (const schematicTraceId of schematicTraceIds) {
        map.set(schematicTraceId, sourceTraceId)
      }
    }

    return map
  }, [schematicTraceIdsBySourceTraceId])

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const styleId = "schematic-trace-net-hover-style"
    if (!svgDiv.querySelector(`style#${styleId}`)) {
      const style = document.createElement("style")
      style.id = styleId
      style.textContent = `
        .${HOVERED_NET_CLASS} {
          filter: invert(1);
        }

        .${HOVERED_NET_CLASS} .trace-crossing-outline {
          opacity: 0;
        }
      `
      svgDiv.appendChild(style)
    }

    const clearHighlights = () => {
      for (const trace of Array.from(
        svgDiv.querySelectorAll(`.${HOVERED_NET_CLASS}`),
      )) {
        trace.classList.remove(HOVERED_NET_CLASS)
      }
    }

    const highlightNetForTrace = (schematicTraceId: string) => {
      clearHighlights()

      const sourceTraceId =
        sourceTraceIdBySchematicTraceId.get(schematicTraceId)
      if (!sourceTraceId) return

      const sourceTrace = sourceTraceById.get(sourceTraceId)
      const connectedNetIds = sourceTrace?.connected_source_net_ids ?? []
      if (connectedNetIds.length === 0) return

      const relatedSchematicTraceIds = new Set<string>()
      for (const sourceNetId of connectedNetIds) {
        for (const relatedSourceTraceId of sourceTraceIdsByNetId.get(
          sourceNetId,
        ) ?? []) {
          for (const relatedSchematicTraceId of schematicTraceIdsBySourceTraceId.get(
            relatedSourceTraceId,
          ) ?? []) {
            relatedSchematicTraceIds.add(relatedSchematicTraceId)
          }
        }
      }

      for (const relatedSchematicTraceId of relatedSchematicTraceIds) {
        for (const traceElement of Array.from(
          svgDiv.querySelectorAll(
            `[data-schematic-trace-id="${escapeCssAttributeValue(
              relatedSchematicTraceId,
            )}"]`,
          ),
        )) {
          traceElement.classList.add(HOVERED_NET_CLASS)
        }
      }
    }

    const removeListeners: Array<() => void> = []
    for (const traceElement of Array.from(
      svgDiv.querySelectorAll<SVGGElement>(
        '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      ),
    )) {
      const schematicTraceId = traceElement.getAttribute(
        "data-schematic-trace-id",
      )
      if (!schematicTraceId) continue

      const handlePointerEnter = () => highlightNetForTrace(schematicTraceId)
      traceElement.addEventListener("pointerenter", handlePointerEnter)
      traceElement.addEventListener("pointerleave", clearHighlights)
      removeListeners.push(() => {
        traceElement.removeEventListener("pointerenter", handlePointerEnter)
        traceElement.removeEventListener("pointerleave", clearHighlights)
      })
    }

    return () => {
      for (const removeListener of removeListeners) {
        removeListener()
      }
      clearHighlights()
    }
  }, [
    svgDivRef,
    svgContentKey,
    schematicTraceIdsBySourceTraceId,
    sourceTraceById,
    sourceTraceIdsByNetId,
    sourceTraceIdBySchematicTraceId,
  ])
}
