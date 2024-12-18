import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { useMemo, useRef } from "react"
import { useResizeHandling } from "../hooks/use-resize-handling"
import { useComponentDragging } from "../hooks/useComponentDragging"
import type { ManualEditEvent } from "../types/edit-events"
import { toString as transformToString } from "transformation-matrix"
import { useChangeSchematicComponentLocationsInSvg } from "lib/hooks/useChangeSchematicComponentLocationsInSvg"

interface Props {
  circuitJson: Array<{ type: string }>
  containerStyle?: React.CSSProperties
  editEvents?: ManualEditEvent[]
  onEditEvent?: (event: ManualEditEvent) => void
}

export const SchematicViewer = ({
  circuitJson,
  containerStyle,
  editEvents = [],
  onEditEvent,
}: Props) => {
  const svgDivRef = useRef<HTMLDivElement>(null)

  const {
    ref: containerRef,
    cancelDrag,
    transform: realToScreenProjection,
  } = useMouseMatrixTransform({
    onSetTransform(transform) {
      if (!svgDivRef.current) return
      svgDivRef.current.style.transform = transformToString(transform)
    },
  })

  const { handleMouseDown, isDragging } = useComponentDragging({
    onEditEvent,
    cancelDrag,
    realToScreenProjection,
  })
  const { containerWidth, containerHeight } = useResizeHandling(containerRef)

  const svgString = useMemo(() => {
    if (!containerWidth || !containerHeight) return ""

    return convertCircuitJsonToSchematicSvg(circuitJson as any, {
      width: containerWidth,
      height: containerHeight || 720,
    })
  }, [circuitJson, containerWidth, containerHeight])

  useChangeSchematicComponentLocationsInSvg(svgDivRef, editEvents)

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: "#F5F1ED",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
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
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    </div>
  )
}
