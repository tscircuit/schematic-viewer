import { useEffect } from "react"
import { type Matrix } from "transformation-matrix"
import type { EditSchematicNetLabelLocationEventWithElement } from "lib/types/edit-events"

/**
 * Moves the net-label / power / ground symbol under the cursor while it is
 * being dragged. The circuit-json only updates on drop, so without this the
 * symbol would sit still until the host re-renders.
 */
export const useChangeSchematicNetLabelLocationsInSvg = ({
  svgDivRef,
  realToSvgProjection,
  activeEditEvent,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  realToSvgProjection: Matrix
  activeEditEvent: EditSchematicNetLabelLocationEventWithElement | null
}) => {
  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const els = svg.querySelectorAll<SVGElement>("[data-schematic-net-label-id]")
    if (!activeEditEvent) {
      for (const el of Array.from(els)) el.style.transform = ""
      return
    }

    const dxMm = activeEditEvent.new_center.x - activeEditEvent.original_center.x
    const dyMm = activeEditEvent.new_center.y - activeEditEvent.original_center.y
    // realToSvgProjection.d is negative (y grows downward in SVG).
    const dx = dxMm * realToSvgProjection.a
    const dy = dyMm * realToSvgProjection.d

    for (const el of Array.from(els)) {
      if (
        el.getAttribute("data-schematic-net-label-id") !==
        activeEditEvent.schematic_net_label_id
      ) {
        continue
      }
      el.style.transform = `translate(${dx}px, ${dy}px)`
    }
  }, [svgDivRef, realToSvgProjection, activeEditEvent])
}
