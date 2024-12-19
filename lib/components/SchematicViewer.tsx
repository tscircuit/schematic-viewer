import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { useMemo, useRef, useState } from "react"
import { EditIcon } from "./EditIcon"
import { useResizeHandling } from "../hooks/use-resize-handling"
import { useComponentDragging } from "../hooks/useComponentDragging"
import type { ManualEditEvent } from "../types/edit-events"
import {
  identity,
  fromString,
  toString as transformToString,
} from "transformation-matrix"
import { useChangeSchematicComponentLocationsInSvg } from "lib/hooks/useChangeSchematicComponentLocationsInSvg"
import { useChangeSchematicTracesForMovedComponents } from "lib/hooks/useChangeSchematicTracesForMovedComponents"
import type { CircuitJson } from "circuit-json"

interface Props {
  circuitJson: CircuitJson
  containerStyle?: React.CSSProperties
  editEvents?: ManualEditEvent[]
  onEditEvent?: (event: ManualEditEvent) => void
  defaultEditMode?: boolean
}

export const SchematicViewer = ({
  circuitJson,
  containerStyle,
  editEvents = [],
  onEditEvent,
  defaultEditMode = false,
}: Props) => {
  const [editModeEnabled, setEditModeEnabled] = useState(defaultEditMode)
  const svgDivRef = useRef<HTMLDivElement>(null)

  const {
    ref: containerRef,
    cancelDrag,
    transform: svgToScreenProjection,
  } = useMouseMatrixTransform({
    onSetTransform(transform) {
      if (!svgDivRef.current) return
      svgDivRef.current.style.transform = transformToString(transform)
    },
  })

  const { containerWidth, containerHeight } = useResizeHandling(containerRef)
  const svgString = useMemo(() => {
    if (!containerWidth || !containerHeight) return ""

    return convertCircuitJsonToSchematicSvg(circuitJson as any, {
      width: containerWidth,
      height: containerHeight || 720,
      grid: {
        cellSize: 1,
        labelCells: true,
      },
    })
  }, [circuitJson, containerWidth, containerHeight])

  const realToSvgProjection = useMemo(() => {
    if (!svgString) return identity()
    const transformString = svgString.match(
      /data-real-to-screen-transform="([^"]+)"/,
    )?.[1]!

    try {
      return fromString(transformString)
    } catch (e) {
      console.error(e)
      return identity()
    }
  }, [svgString])

  const { handleMouseDown, isDragging, activeEditEvent } = useComponentDragging(
    {
      onEditEvent,
      cancelDrag,
      realToSvgProjection,
      svgToScreenProjection,
      circuitJson,
      editEvents,
      enabled: editModeEnabled,
    },
  )

  useChangeSchematicComponentLocationsInSvg({
    svgDivRef,
    editEvents,
    realToSvgProjection,
    svgToScreenProjection,
    activeEditEvent,
  })

  useChangeSchematicTracesForMovedComponents({
    svgDivRef,
    circuitJson,
    activeEditEvent,
  })

  const svgDiv = useMemo(
    () => (
      <div
        ref={svgDivRef}
        style={{
          pointerEvents: "auto",
          transformOrigin: "0 0",
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    ),
    [svgString],
  )

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        backgroundColor: "#F5F1ED",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        minHeight: "300px",
        ...containerStyle,
      }}
      onMouseDown={handleMouseDown}
    >
      <EditIcon
        active={editModeEnabled}
        onClick={() => setEditModeEnabled(!editModeEnabled)}
      />
      {svgDiv}
    </div>
  )
}
