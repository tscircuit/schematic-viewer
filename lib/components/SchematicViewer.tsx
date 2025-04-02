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
import { enableDebug } from "lib/utils/debug"

interface Props {
  circuitJson: any[]
  containerStyle?: React.CSSProperties
  editEvents?: ManualEditEvent[]
  onEditEvent?: (event: ManualEditEvent) => void
  defaultEditMode?: boolean
  debugGrid?: boolean
  editingEnabled?: boolean
  debug?: boolean
}

export const SchematicViewer = ({
  circuitJson,
  containerStyle,
  editEvents = [],
  onEditEvent,
  defaultEditMode = false,
  debugGrid = false,
  editingEnabled = false,
  debug = false,
}: Props) => {
  if (debug) {
    enableDebug()
  }
  const [editModeEnabled, setEditModeEnabled] = useState(defaultEditMode)
  const [isInteractionEnabled, setIsInteractionEnabled] =
    useState<boolean>(false)
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
    // @ts-ignore disabled is a valid prop but not typed
    disabled: !isInteractionEnabled,
  })

  const { containerWidth, containerHeight } = useResizeHandling(containerRef)
  const svgString = useMemo(() => {
    if (!containerWidth || !containerHeight) return ""

    return convertCircuitJsonToSchematicSvg(circuitJson as any, {
      width: containerWidth,
      height: containerHeight || 720,
      grid: !debugGrid
        ? undefined
        : {
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
      enabled: editModeEnabled && isInteractionEnabled,
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
    editEvents,
  })

  const svgDiv = useMemo(
    () => (
      <div
        ref={svgDivRef}
        style={{
          pointerEvents: isInteractionEnabled ? "auto" : "none",
          transformOrigin: "0 0",
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    ),
    [svgString, isInteractionEnabled],
  )

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        backgroundColor: "#F5F1ED",
        overflow: "hidden",
        cursor: isDragging
          ? "grabbing"
          : isInteractionEnabled
            ? "grab"
            : "pointer",
        minHeight: "300px",
        ...containerStyle,
      }}
      onMouseDown={(e) => {
        if (!isInteractionEnabled) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        handleMouseDown(e)
      }}
      onMouseDownCapture={(e) => {
        if (!isInteractionEnabled) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
      }}
    >
      {!isInteractionEnabled && (
        <div
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsInteractionEnabled(true)
          }}
          style={{
            position: "absolute",
            inset: 0,
            cursor: "pointer",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "all",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              pointerEvents: "none",
            }}
          >
            Click to Interact
          </div>
        </div>
      )}
      {editingEnabled && (
        <EditIcon
          active={editModeEnabled}
          onClick={() => setEditModeEnabled(!editModeEnabled)}
        />
      )}
      {svgDiv}
    </div>
  )
}
