import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo } from "react"

const HOVERED_TRACE_CLASS = "schematic-trace-same-net-hover"
const HOVER_STYLE_ID = "schematic-trace-same-net-hover-style"

export const useHighlightSameNetTracesOnHover = ({
  svgDivRef,
  circuitJson,
  svgContentKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  svgContentKey: string
}) => {
  const schematicTraceIdsBySourceTraceId = useMemo(() => {
    const traceIdsBySourceTraceId = new Map<string, string[]>()

    try {
      for (const trace of su(circuitJson).schematic_trace.list()) {
        if (!trace.source_trace_id || !trace.schematic_trace_id) continue

        const traceIds =
          traceIdsBySourceTraceId.get(trace.source_trace_id) ?? []
        traceIds.push(trace.schematic_trace_id)
        traceIdsBySourceTraceId.set(trace.source_trace_id, traceIds)
      }
    } catch (err) {
      console.error("Failed to derive schematic trace hover groups", err)
    }

    return traceIdsBySourceTraceId
  }, [circuitJson])

  const sourceTraceIdBySchematicTraceId = useMemo(() => {
    const sourceTraceIds = new Map<string, string>()

    for (const [
      sourceTraceId,
      schematicTraceIds,
    ] of schematicTraceIdsBySourceTraceId) {
      for (const schematicTraceId of schematicTraceIds) {
        sourceTraceIds.set(schematicTraceId, sourceTraceId)
      }
    }

    return sourceTraceIds
  }, [schematicTraceIdsBySourceTraceId])

  useEffect(() => {
    const svgContainer = svgDivRef.current
    const svg = svgContainer?.querySelector("svg")
    if (!svgContainer || !svg) return

    const traceGroups = Array.from(
      svg.querySelectorAll<SVGGElement>(
        '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      ),
    )

    const ensureHoverStyle = () => {
      if (svg.querySelector(`#${HOVER_STYLE_ID}`)) return

      const style = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "style",
      )
      style.id = HOVER_STYLE_ID
      style.textContent = `
        .${HOVERED_TRACE_CLASS} path:not(.trace-invisible-hover-outline):not(.trace-crossing-outline) {
          stroke: rgb(255, 140, 0) !important;
          filter: drop-shadow(0 0 3px rgba(255, 140, 0, 0.85));
        }

        .${HOVERED_TRACE_CLASS} .trace-crossing-outline {
          opacity: 0;
        }
      `
      svg.appendChild(style)
    }

    let hoveredSourceTraceId: string | null = null

    const clearHoveredTraces = () => {
      if (!hoveredSourceTraceId) return
      hoveredSourceTraceId = null

      for (const traceGroup of traceGroups) {
        traceGroup.classList.remove(HOVERED_TRACE_CLASS)
      }
    }

    const setHoveredTrace = (schematicTraceId: string | null) => {
      const nextSourceTraceId = schematicTraceId
        ? (sourceTraceIdBySchematicTraceId.get(schematicTraceId) ?? null)
        : null

      if (nextSourceTraceId === hoveredSourceTraceId) return

      clearHoveredTraces()
      hoveredSourceTraceId = nextSourceTraceId
      if (!hoveredSourceTraceId) return

      ensureHoverStyle()
      const sameNetTraceIds =
        schematicTraceIdsBySourceTraceId.get(hoveredSourceTraceId) ?? []

      for (const traceGroup of traceGroups) {
        const traceId = traceGroup.getAttribute("data-schematic-trace-id")
        if (traceId && sameNetTraceIds.includes(traceId)) {
          traceGroup.classList.add(HOVERED_TRACE_CLASS)
        }
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const traceGroup = target.closest(
        '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      )
      setHoveredTrace(
        traceGroup?.getAttribute("data-schematic-trace-id") ?? null,
      )
    }

    svg.addEventListener("pointermove", handlePointerMove)
    svg.addEventListener("pointerleave", clearHoveredTraces)
    svg.addEventListener("pointercancel", clearHoveredTraces)

    return () => {
      svg.removeEventListener("pointermove", handlePointerMove)
      svg.removeEventListener("pointerleave", clearHoveredTraces)
      svg.removeEventListener("pointercancel", clearHoveredTraces)
      clearHoveredTraces()
    }
  }, [
    schematicTraceIdsBySourceTraceId,
    sourceTraceIdBySchematicTraceId,
    svgContentKey,
    svgDivRef,
  ])
}
