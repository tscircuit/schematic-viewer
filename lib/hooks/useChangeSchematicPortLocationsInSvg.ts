import { su } from "@tscircuit/soup-util"
import { useEffect, useRef } from "react"
import { type Matrix } from "transformation-matrix"
import type {
  EditSchematicPortLocationEventWithElement,
  ExtendedManualEditEvent,
} from "../types/edit-events"

interface Args {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: any[]
  realToSvgProjection: Matrix
  editEvents: ExtendedManualEditEvent[]
  activeEditEvent: EditSchematicPortLocationEventWithElement | null
}

/**
 * ONLY port-location edits — never component moves.
 * Pins live inside the component <g>, so a component drag already moves them
 * via useChangeSchematicComponentLocationsInSvg. Applying component deltas here
 * would double-transform pins and detach wires.
 */
function collectPortOnlyOffsets(
  editEvents: ExtendedManualEditEvent[],
  activeEditEvent: EditSchematicPortLocationEventWithElement | null,
) {
  const offsets = new Map<string, { x: number; y: number }>()
  const apply = (
    portId: string,
    original: { x: number; y: number },
    next: { x: number; y: number },
  ) => {
    const prev = offsets.get(portId) ?? { x: 0, y: 0 }
    offsets.set(portId, {
      x: prev.x + (next.x - original.x),
      y: prev.y + (next.y - original.y),
    })
  }
  for (const ev of editEvents) {
    if (
      "edit_event_type" in ev &&
      ev.edit_event_type === "edit_schematic_port_location"
    ) {
      apply(ev.schematic_port_id, ev.original_center, ev.new_center)
    }
  }
  if (activeEditEvent) {
    apply(
      activeEditEvent.schematic_port_id,
      activeEditEvent.original_center,
      activeEditEvent.new_center,
    )
  }
  return offsets
}

function resolveOffset(
  attrId: string,
  offsets: Map<string, { x: number; y: number }>,
  sourceToSch: Map<string, string>,
): { x: number; y: number } | undefined {
  if (offsets.has(attrId)) return offsets.get(attrId)
  const schId = sourceToSch.get(attrId)
  if (schId && offsets.has(schId)) return offsets.get(schId)
  return undefined
}

export const useChangeSchematicPortLocationsInSvg = ({
  svgDivRef,
  circuitJson,
  realToSvgProjection,
  editEvents,
  activeEditEvent,
}: Args) => {
  const lastSvgContentRef = useRef<string | null>(null)

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const sourceToSch = new Map<string, string>()
    for (const p of su(circuitJson).schematic_port.list() as {
      schematic_port_id: string
      source_port_id?: string
    }[]) {
      if (p.source_port_id) sourceToSch.set(p.source_port_id, p.schematic_port_id)
    }

    const apply = () => {
      const offsets = collectPortOnlyOffsets(editEvents, activeEditEvent)
      const targets = svg.querySelectorAll<SVGElement>(
        "[data-schematic-port-id]",
      )
      for (const el of Array.from(targets)) {
        const id = el.getAttribute("data-schematic-port-id")
        if (!id) continue
        const off = resolveOffset(id, offsets, sourceToSch)
        if (!off) {
          if (el.style.transform.includes("port-drag")) {
            el.style.transform = ""
          }
          continue
        }
        const px = {
          x: off.x * realToSvgProjection.a,
          y: off.y * realToSvgProjection.d,
        }
        el.style.transform = `translate(${px.x}px, ${px.y}px) /* port-drag */`
      }
    }

    const observer = new MutationObserver(() => {
      const content = svg.innerHTML
      if (content !== lastSvgContentRef.current) {
        lastSvgContentRef.current = content
        apply()
      }
    })
    observer.observe(svg, { childList: true, subtree: true })
    apply()

    return () => observer.disconnect()
  }, [
    svgDivRef,
    circuitJson,
    realToSvgProjection,
    editEvents,
    activeEditEvent,
  ])
}
