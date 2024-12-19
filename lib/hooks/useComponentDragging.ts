import { useCallback, useEffect, useRef, useState } from "react"
import type {
  EditSchematicComponentLocationEventWithElement,
  ManualEditEvent,
} from "../types/edit-events"
import {
  type Matrix,
  applyToPoint,
  inverse,
  compose,
} from "transformation-matrix"
import { getComponentOffsetDueToEvents } from "lib/utils/get-component-offset-due-to-events"
import type { CircuitJson } from "circuit-json"
import { su } from "@tscircuit/soup-util"

export const useComponentDragging = ({
  onEditEvent,
  editEvents = [],
  circuitJson,
  cancelDrag,
  svgToScreenProjection,
  realToSvgProjection,
  enabled = false,
}: {
  circuitJson: any[]
  editEvents: ManualEditEvent[]
  /** The projection returned from use-mouse-matrix-transform, indicating zoom on svg */
  svgToScreenProjection: Matrix
  /** The projection returned from circuit-to-svg, mm to svg */
  realToSvgProjection: Matrix
  onEditEvent?: (event: ManualEditEvent) => void
  cancelDrag?: () => void
  enabled?: boolean
}): {
  handleMouseDown: (e: React.MouseEvent) => void
  isDragging: boolean
  activeEditEvent: EditSchematicComponentLocationEventWithElement | null
} => {
  const [activeEditEvent, setActiveEditEvent] =
    useState<EditSchematicComponentLocationEventWithElement | null>(null)
  const realToScreenProjection = compose(
    realToSvgProjection,
    svgToScreenProjection,
  )

  /**
   * Drag start position in screen space
   */
  const dragStartPosRef = useRef<{
    x: number
    y: number
  } | null>(null)

  const activeEditEventRef =
    useRef<EditSchematicComponentLocationEventWithElement | null>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return

      const target = e.target as SVGElement
      const componentGroup = target.closest(
        '[data-circuit-json-type="schematic_component"]',
      )
      if (!componentGroup) return

      const schematic_component_id = componentGroup.getAttribute(
        "data-schematic-component-id",
      )
      if (!schematic_component_id) return

      if (cancelDrag) cancelDrag()

      const schematic_component = su(circuitJson).schematic_component.get(
        schematic_component_id,
      )
      if (!schematic_component) return
      const editEventOffset = getComponentOffsetDueToEvents({
        editEvents,
        schematic_component_id: schematic_component_id,
      })

      dragStartPosRef.current = {
        x: e.clientX,
        y: e.clientY,
      }

      const original_center = {
        x: schematic_component.center.x + editEventOffset.x,
        y: schematic_component.center.y + editEventOffset.y,
      }

      const newEditEvent: EditSchematicComponentLocationEventWithElement = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_component_location",
        schematic_component_id: schematic_component_id,
        original_center,
        new_center: { ...original_center },
        in_progress: true,
        created_at: Date.now(),
        _element: componentGroup as any,
      }

      activeEditEventRef.current = newEditEvent
    },
    [cancelDrag, enabled],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!activeEditEventRef.current || !dragStartPosRef.current) return

      const screenDelta = {
        x: e.clientX - dragStartPosRef.current.x,
        y: e.clientY - dragStartPosRef.current.y,
      }

      const mmDelta = {
        x: screenDelta.x / realToScreenProjection.a,
        y: screenDelta.y / realToScreenProjection.d,
      }

      const newEditEvent = {
        ...activeEditEventRef.current,
        new_center: {
          x: activeEditEventRef.current.original_center.x + mmDelta.x,
          y: activeEditEventRef.current.original_center.y + mmDelta.y,
        },
      }

      activeEditEventRef.current = newEditEvent
      setActiveEditEvent(newEditEvent)
    },
    [realToScreenProjection],
  )

  const handleMouseUp = useCallback(() => {
    if (!activeEditEventRef.current) return
    const finalEvent = {
      ...activeEditEventRef.current,
      in_progress: false,
    }
    if (onEditEvent) onEditEvent(finalEvent)
    activeEditEventRef.current = null
    dragStartPosRef.current = null
    setActiveEditEvent(null)
  }, [onEditEvent])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return {
    handleMouseDown,
    isDragging: !!activeEditEventRef.current,
    activeEditEvent: activeEditEvent,
  }
}
