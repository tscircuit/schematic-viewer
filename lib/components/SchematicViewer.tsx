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
  const [activeEditEvent, setActiveEditEvent] =
    useState<ManualEditEventWithElement | null>(null)
  const [dragStartPos, setDragStartPos] = useState<{
    x: number
    y: number
  } | null>(null)

  const { ref: containerRef } = useMouseMatrixTransform({
    onSetTransform(transform) {
      if (!svgDivRef.current) return
      if (activeEditEvent) return
      svgDivRef.current.style.transform = transformToString(transform)
    },
    enabled: !activeEditEvent,
  })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as SVGElement
      const componentGroup = target.closest(
        '[data-circuit-json-type="schematic_component"]',
      )
      console.log({
        target,
        componentGroup,
      })
      if (!componentGroup) return

      const componentId = componentGroup.getAttribute(
        "data-schematic-component-id",
      )
      if (!componentId) return

      const rect = componentGroup.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      setDragStartPos({ x: centerX, y: centerY })

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

      setActiveEditEvent(newEditEvent)
      if (onEditEvent) onEditEvent(newEditEvent)
    },
    [onEditEvent],
  )

  const handleMouseMove = (e: MouseEvent) => {
    if (!activeEditEvent || !dragStartPos) return

    const delta = {
      x: e.clientX - dragStartPos.x,
      y: e.clientY - dragStartPos.y,
    }

    const newEditEvent = {
      ...activeEditEvent,
      new_center: {
        x: activeEditEvent.original_center.x + delta.x,
        y: activeEditEvent.original_center.y + delta.y,
      },
    }

    // Find the element on the page and move it
    // console.log(activeEditEvent._element)
    console.log(e.clientX, e.clientY)
    activeEditEvent._element.style.transform = `translate(${delta.x}px, ${delta.y}px)`

    setActiveEditEvent(newEditEvent)
    if (onEditEvent) onEditEvent(newEditEvent)
  }

  const handleMouseUp = () => {
    if (!activeEditEvent) return
    const finalEvent = {
      ...activeEditEvent,
      in_progress: false,
    }
    if (onEditEvent) onEditEvent(finalEvent)
    setActiveEditEvent(null)
    setDragStartPos(null)
  }

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [Boolean(activeEditEvent)])
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
        cursor: activeEditEvent ? "grabbing" : "grab",
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
