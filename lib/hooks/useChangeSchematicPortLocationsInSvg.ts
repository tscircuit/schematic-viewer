import { useEffect, useRef } from "react"
import { type Matrix } from "transformation-matrix"
import type {
  EditSchematicPortLocationEventWithElement,
  ExtendedManualEditEvent,
} from "../types/edit-events"

interface Args {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  realToSvgProjection: Matrix
  editEvents: ExtendedManualEditEvent[]
  activeEditEvent: EditSchematicPortLocationEventWithElement | null
}

// Cumulative (mm) offset per port from completed events + optional active drag.
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
 * Translates dragged schematic ports in the SVG independently of their parent
 * component group, mirroring `useChangeSchematicComponentLocationsInSvg` for
 * ports. Any offset already applied by the parent component drag stays intact.
 */
export const useChangeSchematicPortLocationsInSvg = ({
  svgDivRef,
  realToSvgProjection,
  editEvents,
  activeEditEvent,
}: Args) => {
  const lastSvgContentRef = useRef<string | null>(null)

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const apply = () => {
      const offsets = collectOffsets(editEvents, activeEditEvent)
      const targets = svg.querySelectorAll<SVGElement>(
        "[data-schematic-port-id]",
      )
      for (const el of Array.from(targets)) {
        const id = el.getAttribute("data-schematic-port-id")
        if (!id) continue
        const off = offsets.get(id)
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
        // Tag the transform so the reset above can tell "we own this" apart
        // from a transform set by the parent component drag.
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
  }, [svgDivRef, realToSvgProjection, editEvents, activeEditEvent])
}
