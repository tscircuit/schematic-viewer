import { su } from "@tscircuit/soup-util"
import Debug from "lib/utils/debug"
import { getComponentOffsetDueToEvents } from "lib/utils/get-component-offset-due-to-events"
import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import type {
  EditSchematicComponentLocationEventWithElement,
  ManualEditEvent,
} from "../types/edit-events"

const debug = Debug.extend("useComponentDragging")

export const useComponentDragging = ({
  onEditEvent,
  editEvents = [],
  circuitJson,
  cancelDrag,
  svgToScreenProjection,
  realToSvgProjection,
  enabled = false,
  snapToGrid = false,
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
  snapToGrid?: boolean
}): {
  handleMouseDown: (e: React.MouseEvent) => void
  handleTouchStart: (e: React.TouchEvent) => void
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

  // Store the latest positions of components being tracked
  const componentPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  )

  // Update position map with the latest positions from edit events
  useEffect(() => {
    // Process completed edit events to track latest positions
    editEvents.forEach((event) => {
      if (
        "edit_event_type" in event &&
        event.edit_event_type === "edit_schematic_component_location" &&
        !event.in_progress
      ) {
        componentPositionsRef.current.set(event.schematic_component_id, {
          ...event.new_center,
        })
      }
    })
  }, [editEvents])

  const startDrag = useCallback(
    (clientX: number, clientY: number, target: Element) => {
      if (!enabled) return false

      const componentGroup = target.closest(
        '[data-circuit-json-type="schematic_component"]',
      )
      if (!componentGroup) return false

      const schematic_component_id = componentGroup.getAttribute(
        "data-schematic-component-id",
      )
      if (!schematic_component_id) return false

      if (cancelDrag) cancelDrag()

      const schematic_component = su(circuitJson).schematic_component.get(
        schematic_component_id,
      )
      if (!schematic_component) return false

      dragStartPosRef.current = { x: clientX, y: clientY }

      let current_position: { x: number; y: number }
      const trackedPosition = componentPositionsRef.current.get(
        schematic_component_id,
      )

      if (trackedPosition) {
        current_position = { ...trackedPosition }
      } else {
        const editEventOffset = getComponentOffsetDueToEvents({
          editEvents,
          schematic_component_id: schematic_component_id,
        })

        current_position = {
          x: schematic_component.center.x + editEventOffset.x,
          y: schematic_component.center.y + editEventOffset.y,
        }

        componentPositionsRef.current.set(schematic_component_id, {
          ...current_position,
        })
      }

      const newEditEvent: EditSchematicComponentLocationEventWithElement = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_component_location",
        schematic_component_id: schematic_component_id,
        original_center: current_position,
        new_center: { ...current_position },
        in_progress: true,
        created_at: Date.now(),
        _element: componentGroup as any,
      }

      activeEditEventRef.current = newEditEvent
      setActiveEditEvent(newEditEvent)
      return true
    },
    [cancelDrag, enabled, circuitJson, editEvents],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      startDrag(e.clientX, e.clientY, e.target as Element)
    },
    [startDrag],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      if (startDrag(touch.clientX, touch.clientY, e.target as Element)) {
        e.preventDefault()
      }
    },
    [startDrag],
  )

  const updateDragPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!activeEditEventRef.current || !dragStartPosRef.current) return

      const screenDelta = {
        x: clientX - dragStartPosRef.current.x,
        y: clientY - dragStartPosRef.current.y,
      }

      const mmDelta = {
        x: screenDelta.x / realToScreenProjection.a,
        y: screenDelta.y / realToScreenProjection.d,
      }

      let newCenter = {
        x: activeEditEventRef.current.original_center.x + mmDelta.x,
        y: activeEditEventRef.current.original_center.y + mmDelta.y,
      }
      if (snapToGrid) {
        const snap = (v: number) => Math.round(v * 10) / 10
        newCenter = { x: snap(newCenter.x), y: snap(newCenter.y) }
      }

      const newEditEvent = {
        ...activeEditEventRef.current,
        new_center: newCenter,
      }

      activeEditEventRef.current = newEditEvent
      setActiveEditEvent(newEditEvent)
    },
    [realToScreenProjection, snapToGrid],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => updateDragPosition(e.clientX, e.clientY),
    [updateDragPosition],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 1 || !activeEditEventRef.current) return
      e.preventDefault()
      const touch = e.touches[0]
      updateDragPosition(touch.clientX, touch.clientY)
    },
    [updateDragPosition],
  )

  const endDrag = useCallback(() => {
    if (!activeEditEventRef.current) return
    const finalEvent = {
      ...activeEditEventRef.current,
      in_progress: false,
    }

    componentPositionsRef.current.set(finalEvent.schematic_component_id, {
      ...finalEvent.new_center,
    })

    debug("endDrag calling onEditEvent with new edit event", {
      newEditEvent: finalEvent,
    })
    if (onEditEvent) onEditEvent(finalEvent)
    activeEditEventRef.current = null
    dragStartPosRef.current = null
    setActiveEditEvent(null)
  }, [onEditEvent])

  const handleMouseUp = useCallback(() => endDrag(), [endDrag])
  const handleTouchEnd = useCallback(() => endDrag(), [endDrag])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  return {
    handleMouseDown,
    handleTouchStart,
    isDragging: !!activeEditEventRef.current,
    activeEditEvent: activeEditEvent,
  }
}
