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

      dragStartPosRef.current = {
        x: e.clientX,
        y: e.clientY,
      }

      // Get the current position of the component
      // Check if we're already tracking this component
      let current_position: { x: number; y: number }
      const trackedPosition = componentPositionsRef.current.get(
        schematic_component_id,
      )

      if (trackedPosition) {
        // Use the tracked position from previous edits
        current_position = { ...trackedPosition }
      } else {
        // Calculate position based on component data and edit events
        const editEventOffset = getComponentOffsetDueToEvents({
          editEvents,
          schematic_component_id: schematic_component_id,
        })

        current_position = {
          x: schematic_component.center.x + editEventOffset.x,
          y: schematic_component.center.y + editEventOffset.y,
        }

        // Store this initial position
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
    },
    [cancelDrag, enabled, circuitJson, editEvents],
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

  const handleMouseUp = useCallback(() => {
    if (!activeEditEventRef.current) return
    const finalEvent = {
      ...activeEditEventRef.current,
      in_progress: false,
    }

    // Update our stored position for this component
    componentPositionsRef.current.set(finalEvent.schematic_component_id, {
      ...finalEvent.new_center,
    })

    debug("handleMouseUp calling onEditEvent with new edit event", {
      newEditEvent: finalEvent,
    })
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
