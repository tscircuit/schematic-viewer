import { useCallback, useEffect, useRef } from "react"
import type { ManualEditEvent } from "../types/edit-events"

type ManualEditEventWithElement = ManualEditEvent & {
  _element: SVGElement
}

export const useComponentDragging = ({
  onEditEvent,
  cancelDrag,
}: {
  onEditEvent?: (event: ManualEditEvent) => void
  cancelDrag?: () => void
}) => {
  const dragStartPosRef = useRef<{
    x: number
    y: number
  } | null>(null)

  const activeEditEventRef = useRef<ManualEditEventWithElement | null>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as SVGElement
      const componentGroup = target.closest(
        '[data-circuit-json-type="schematic_component"]',
      )
      if (!componentGroup) return

      const componentId = componentGroup.getAttribute(
        "data-schematic-component-id",
      )
      if (!componentId) return

      if (cancelDrag) cancelDrag()
      const rect = componentGroup.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      dragStartPosRef.current = { x: centerX, y: centerY }

      const newEditEvent: ManualEditEventWithElement = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_component_location",
        schematic_component_id: componentId,
        original_center: { x: centerX, y: centerY },
        new_center: { x: centerX, y: centerY },
        in_progress: true,
        created_at: Date.now(),
        _element: componentGroup as any,
      }

      activeEditEventRef.current = newEditEvent
      if (onEditEvent) onEditEvent(newEditEvent)
    },
    [onEditEvent, cancelDrag],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!activeEditEventRef.current || !dragStartPosRef.current) return

      const delta = {
        x: e.clientX - dragStartPosRef.current.x,
        y: e.clientY - dragStartPosRef.current.y,
      }

      const newEditEvent = {
        ...activeEditEventRef.current,
        new_center: {
          x: activeEditEventRef.current.original_center.x + delta.x,
          y: activeEditEventRef.current.original_center.y + delta.y,
        },
      }

      activeEditEventRef.current._element.style.transform = `translate(${delta.x}px, ${delta.y}px)`

      activeEditEventRef.current = newEditEvent
      if (onEditEvent) onEditEvent(newEditEvent)
    },
    [onEditEvent],
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
  }
}
