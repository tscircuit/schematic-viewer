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

// Cumulative (mm) offset per schematic_port_id from completed events + active drag.
function collectOffsets(
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

/**
 * circuit-to-svg stamps BOTH ids onto SVG:
 *  - pin groups inside components → data-schematic-port-id = source_port_id
 *  - optional drawPorts indicators → data-schematic-port-id = schematic_port_id
 * Offsets are always keyed by schematic_port_id; resolve either attribute value.
 */
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

/**
 * Translates dragged schematic ports in the SVG independently of their parent
 * component group. Moves the real pin circles (`.sch-port`) the user sees.
 */
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
      const offsets = collectOffsets(editEvents, activeEditEvent)
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
