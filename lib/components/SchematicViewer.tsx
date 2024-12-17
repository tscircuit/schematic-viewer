import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useResizeHandling } from "../hooks/use-resize-handling"
import type { ManualEditEvent } from "lib/types/edit-events"
import { toString as transformToString } from "transformation-matrix"

interface Props {
  circuitJson: Array<{ type: string }>
  containerStyle?: React.CSSProperties
  editEvents?: ManualEditEvent[]
  onEditEvent?: (event: ManualEditEvent) => void
}

type ManualEditEventWithElement = ManualEditEvent & {
  _element: SVGElement
}

export const SchematicViewer = ({
  circuitJson,
  containerStyle,
  editEvents = [],
  onEditEvent,
}: Props) => {
  const svgDivRef = useRef<HTMLDivElement>(null)

  const dragStartPosRef = useRef<{
    x: number
    y: number
  } | null>(null)

  const activeEditEventRef = useRef<ManualEditEventWithElement | null>(null)

  const { ref: containerRef, cancelDrag } = useMouseMatrixTransform({
    onSetTransform(transform) {
      if (!svgDivRef.current) return
      if (activeEditEventRef.current) return
      svgDivRef.current.style.transform = transformToString(transform)
    },
  })

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

      cancelDrag()
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
    [onEditEvent],
  )

  const handleMouseMove = (e: MouseEvent) => {
    console.log("activeEditEventRef.current", activeEditEventRef.current)
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

    // Find the element on the page and move it
    // console.log(activeEditEvent._element)
    activeEditEventRef.current._element.style.transform = `translate(${delta.x}px, ${delta.y}px)`

    activeEditEventRef.current = newEditEvent
    if (onEditEvent) onEditEvent(newEditEvent)
  }

  const handleMouseUp = () => {
    if (!activeEditEventRef.current) return
    const finalEvent = {
      ...activeEditEventRef.current,
      in_progress: false,
    }
    if (onEditEvent) onEditEvent(finalEvent)
    activeEditEventRef.current = null
    dragStartPosRef.current = null
  }

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])
  const { containerWidth, containerHeight } = useResizeHandling(containerRef)

  const svg = useMemo(() => {
    if (!containerWidth || !containerHeight) return ""

    return convertCircuitJsonToSchematicSvg(circuitJson as any, {
      width: containerWidth,
      height: containerHeight || 720,
    })
  }, [circuitJson, containerWidth, containerHeight])

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: "#F5F1ED",
        overflow: "hidden",
        cursor: activeEditEventRef.current ? "grabbing" : "grab",
        minHeight: "300px",
        ...containerStyle,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        ref={svgDivRef}
        style={{
          pointerEvents: "auto",
          transformOrigin: "0 0",
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
