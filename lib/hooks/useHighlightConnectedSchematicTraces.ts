import { useEffect, useRef, type RefObject } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

const TRACE_SELECTOR = '[data-circuit-json-type="schematic_trace"]'
const HIGHLIGHTED_TRACE_CLASS = "schematic-trace-net-hover"

const findTraceElement = (target: EventTarget | null): Element | null => {
  if (!(target instanceof Element)) return null
  return target.closest(TRACE_SELECTOR)
}

const isString = (value: string | undefined | null): value is string =>
  typeof value === "string"

type SchematicTrace = Extract<CircuitJson[number], { type: "schematic_trace" }>

const getTraceNetKey = (trace: SchematicTrace) =>
  trace.subcircuit_connectivity_map_key ?? trace.source_trace_id

export const useHighlightConnectedSchematicTraces = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  const highlightedElementsRef = useRef<Element[]>([])

  useEffect(() => {
    const svgContainer = svgDivRef.current
    if (!svgContainer) return

    const schematicTracesById = new Map(
      su(circuitJson)
        .schematic_trace.list()
        .map((trace) => [trace.schematic_trace_id, trace]),
    )

    const clearHighlights = () => {
      for (const element of highlightedElementsRef.current) {
        element.classList.remove(HIGHLIGHTED_TRACE_CLASS)
      }
      highlightedElementsRef.current = []
    }

    const highlightTraceNet = (schematicTraceId: string | null) => {
      clearHighlights()
      if (!schematicTraceId) return

      const hoveredTrace = schematicTracesById.get(schematicTraceId)
      const traceNetKey = hoveredTrace ? getTraceNetKey(hoveredTrace) : null
      if (!traceNetKey) return

      const connectedTraceIds = su(circuitJson)
        .schematic_trace.list()
        .filter((trace) => getTraceNetKey(trace) === traceNetKey)
        .map((trace) => trace.schematic_trace_id)
        .filter(isString)

      for (const traceId of connectedTraceIds) {
        const traceElements = svgContainer.querySelectorAll(
          `[data-schematic-trace-id="${traceId}"] path`,
        )
        for (const traceElement of Array.from(traceElements)) {
          if (traceElement.getAttribute("class")?.includes("invisible"))
            continue
          traceElement.classList.add(HIGHLIGHTED_TRACE_CLASS)
          highlightedElementsRef.current.push(traceElement)
        }
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const traceElement = findTraceElement(event.target)
      const schematicTraceId = traceElement?.getAttribute(
        "data-schematic-trace-id",
      )

      if (!schematicTraceId) {
        clearHighlights()
        return
      }

      if (
        highlightedElementsRef.current.some((element) =>
          element.closest(`[data-schematic-trace-id="${schematicTraceId}"]`),
        )
      ) {
        return
      }

      highlightTraceNet(schematicTraceId)
    }

    const handlePointerLeave = () => {
      clearHighlights()
    }

    if (!svgContainer.querySelector("style#schematic-trace-net-hover-style")) {
      const style = document.createElement("style")
      style.id = "schematic-trace-net-hover-style"
      style.textContent = `
        .${HIGHLIGHTED_TRACE_CLASS} {
          stroke: #2563eb !important;
          stroke-width: 0.08px !important;
          opacity: 1 !important;
          transition: stroke 120ms ease, stroke-width 120ms ease, opacity 120ms ease;
        }
      `
      svgContainer.appendChild(style)
    }

    svgContainer.addEventListener("pointermove", handlePointerMove)
    svgContainer.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      svgContainer.removeEventListener("pointermove", handlePointerMove)
      svgContainer.removeEventListener("pointerleave", handlePointerLeave)
      clearHighlights()
    }
  }, [svgDivRef, circuitJson, circuitJsonKey])
}
