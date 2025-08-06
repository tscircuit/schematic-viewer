import {
  convertCircuitJsonToSchematicSvg,
  type ColorOverrides,
} from "circuit-to-svg"
import { useChangeSchematicComponentLocationsInSvg } from "lib/hooks/useChangeSchematicComponentLocationsInSvg"
import { useChangeSchematicTracesForMovedComponents } from "lib/hooks/useChangeSchematicTracesForMovedComponents"
import { enableDebug } from "lib/utils/debug"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  fromString,
  identity,
  toString as transformToString,
} from "transformation-matrix"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { useResizeHandling } from "../hooks/use-resize-handling"
import { useComponentDragging } from "../hooks/useComponentDragging"
import type { ManualEditEvent } from "../types/edit-events"
import { EditIcon } from "./EditIcon"
import { GridIcon } from "./GridIcon"
import type { CircuitJson } from "circuit-json"
import { SpiceSimulationIcon } from "./SpiceSimulationIcon"
import { SpiceSimulationOverlay } from "./SpiceSimulationOverlay"
import { zIndexMap } from "../utils/z-index-map"
import { useSpiceSimulation } from "../hooks/useSpiceSimulation"
import { getSpiceFromCircuitJson } from "../utils/spice-utils"

interface Props {
  circuitJson: CircuitJson
  containerStyle?: React.CSSProperties
  editEvents?: ManualEditEvent[]
  onEditEvent?: (event: ManualEditEvent) => void
  defaultEditMode?: boolean
  debugGrid?: boolean
  editingEnabled?: boolean
  debug?: boolean
  clickToInteractEnabled?: boolean
  colorOverrides?: ColorOverrides
  spiceSimulationEnabled?: boolean
}

export const SchematicViewer = ({
  circuitJson,
  containerStyle,
  editEvents: unappliedEditEvents = [],
  onEditEvent,
  defaultEditMode = false,
  debugGrid = false,
  editingEnabled = false,
  debug = false,
  clickToInteractEnabled = false,
  colorOverrides,
  spiceSimulationEnabled = false,
}: Props) => {
  if (debug) {
    enableDebug()
  }
  const [showSpiceOverlay, setShowSpiceOverlay] = useState(false)

  const getCircuitHash = (circuitJson: CircuitJson) => {
    return `${circuitJson?.length || 0}_${(circuitJson as any)?.editCount || 0}`
  }

  const circuitJsonKey = useMemo(
    () => getCircuitHash(circuitJson),
    [circuitJson],
  )

  const spiceString = useMemo(() => {
    if (!spiceSimulationEnabled) return null
    try {
      return getSpiceFromCircuitJson(circuitJson)
    } catch (e) {
      console.error("Failed to generate SPICE string", e)
      return null
    }
  }, [circuitJsonKey, spiceSimulationEnabled])

  const {
    plotData,
    nodes,
    isLoading: isSpiceSimLoading,
    error: spiceSimError,
  } = useSpiceSimulation(spiceString)

  const [editModeEnabled, setEditModeEnabled] = useState(defaultEditMode)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [isInteractionEnabled, setIsInteractionEnabled] = useState<boolean>(
    !clickToInteractEnabled,
  )
  const svgDivRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0]
    const start = touchStartRef.current
    if (!start) return

    const deltaX = Math.abs(touch.clientX - start.x)
    const deltaY = Math.abs(touch.clientY - start.y)

    if (deltaX < 10 && deltaY < 10) {
      e.preventDefault()
      setIsInteractionEnabled(true)
    }

    touchStartRef.current = null
  }

  const [internalEditEvents, setInternalEditEvents] = useState<
    ManualEditEvent[]
  >([])
  const circuitJsonRef = useRef<CircuitJson>(circuitJson)

  useEffect(() => {
    const circuitHash = getCircuitHash(circuitJson)
    const circuitHashRef = getCircuitHash(circuitJsonRef.current)

    if (circuitHash !== circuitHashRef) {
      setInternalEditEvents([])
      circuitJsonRef.current = circuitJson
    }
  }, [circuitJson])

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
    enabled: isInteractionEnabled && !showSpiceOverlay,
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
      colorOverrides,
    })
  }, [circuitJson, containerWidth, containerHeight])

  const containerBackgroundColor = useMemo(() => {
    const match = svgString.match(
      /<svg[^>]*style="[^"]*background-color:\s*([^;\"]+)/i,
    )
    return match?.[1] ?? "transparent"
  }, [svgString])

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

  const handleEditEvent = (event: ManualEditEvent) => {
    setInternalEditEvents((prev) => [...prev, event])
    if (onEditEvent) {
      onEditEvent(event)
    }
  }

  const editEventsWithUnappliedEditEvents = useMemo(() => {
    return [...unappliedEditEvents, ...internalEditEvents]
  }, [unappliedEditEvents, internalEditEvents])

  const { handleMouseDown, isDragging, activeEditEvent } = useComponentDragging(
    {
      onEditEvent: handleEditEvent,
      cancelDrag,
      realToSvgProjection,
      svgToScreenProjection,
      circuitJson,
      editEvents: editEventsWithUnappliedEditEvents,
      enabled: editModeEnabled && isInteractionEnabled && !showSpiceOverlay,
      snapToGrid,
    },
  )

  useChangeSchematicComponentLocationsInSvg({
    svgDivRef,
    editEvents: editEventsWithUnappliedEditEvents,
    realToSvgProjection,
    svgToScreenProjection,
    activeEditEvent,
  })

  useChangeSchematicTracesForMovedComponents({
    svgDivRef,
    circuitJson,
    activeEditEvent,
    editEvents: editEventsWithUnappliedEditEvents,
  })

  const svgDiv = useMemo(
    () => (
      <div
        ref={svgDivRef}
        style={{
          pointerEvents: clickToInteractEnabled
            ? isInteractionEnabled
              ? "auto"
              : "none"
            : "auto",
          transformOrigin: "0 0",
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    ),
    [svgString, isInteractionEnabled, clickToInteractEnabled],
  )

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        backgroundColor: containerBackgroundColor,
        overflow: "hidden",
        cursor: showSpiceOverlay
          ? "auto"
          : isDragging
            ? "grabbing"
            : clickToInteractEnabled && !isInteractionEnabled
              ? "pointer"
              : "grab",
        minHeight: "300px",
        ...containerStyle,
      }}
      onWheelCapture={(e) => {
        if (showSpiceOverlay) {
          e.stopPropagation()
        }
      }}
      onMouseDown={(e) => {
        if (clickToInteractEnabled && !isInteractionEnabled) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        handleMouseDown(e)
      }}
      onMouseDownCapture={(e) => {
        if (clickToInteractEnabled && !isInteractionEnabled) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
      }}
      onTouchStart={(e) => {
        if (showSpiceOverlay) return
        handleTouchStart(e)
      }}
      onTouchEnd={(e) => {
        if (showSpiceOverlay) return
        handleTouchEnd(e)
      }}
    >
      {!isInteractionEnabled && clickToInteractEnabled && (
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
            zIndex: zIndexMap.clickToInteractOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "all",
            touchAction: "pan-x pan-y pinch-zoom",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              fontFamily: "sans-serif",
              pointerEvents: "none",
            }}
          >
            {typeof window !== "undefined" &&
            ("ontouchstart" in window || navigator.maxTouchPoints > 0)
              ? "Touch to Interact"
              : "Click to Interact"}
          </div>
        </div>
      )}
      {editingEnabled && (
        <EditIcon
          active={editModeEnabled}
          onClick={() => setEditModeEnabled(!editModeEnabled)}
        />
      )}
      {editingEnabled && editModeEnabled && (
        <GridIcon
          active={snapToGrid}
          onClick={() => setSnapToGrid(!snapToGrid)}
        />
      )}
      {spiceSimulationEnabled && (
        <SpiceSimulationIcon onClick={() => setShowSpiceOverlay(true)} />
      )}
      {showSpiceOverlay && (
        <SpiceSimulationOverlay
          spiceString={spiceString}
          onClose={() => setShowSpiceOverlay(false)}
          plotData={plotData}
          nodes={nodes}
          isLoading={isSpiceSimLoading}
          error={spiceSimError}
        />
      )}
      {svgDiv}
    </div>
  )
}
