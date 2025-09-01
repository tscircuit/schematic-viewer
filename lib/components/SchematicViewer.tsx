import {
  convertCircuitJsonToSchematicSvg,
  type ColorOverrides,
} from "circuit-to-svg"
import { useChangeSchematicComponentLocationsInSvg } from "lib/hooks/useChangeSchematicComponentLocationsInSvg"
import { useChangeSchematicTracesForMovedComponents } from "lib/hooks/useChangeSchematicTracesForMovedComponents"
import { useSchematicGroupsOverlay } from "lib/hooks/useSchematicGroupsOverlay"
import { enableDebug } from "lib/utils/debug"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { ViewMenuIcon } from "./ViewMenuIcon"
import { ViewMenu } from "./ViewMenu"
import type { CircuitJson } from "circuit-json"
import { SpiceSimulationIcon } from "./SpiceSimulationIcon"
import { SpiceSimulationOverlay } from "./SpiceSimulationOverlay"
import { zIndexMap } from "../utils/z-index-map"
import { useSpiceSimulation } from "../hooks/useSpiceSimulation"
import { getSpiceFromCircuitJson } from "../utils/spice-utils"

// Optimized click-to-interact overlay component
const ClickToInteractOverlay = ({ onEnable }: { onEnable: () => void }) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onEnable()
    },
    [onEnable],
  )

  const overlayStyle = useMemo(
    () => ({
      position: "absolute" as const,
      inset: 0,
      cursor: "pointer" as const,
      zIndex: zIndexMap.clickToInteractOverlay,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "all" as const,
      touchAction: "pan-x pan-y pinch-zoom" as const,
    }),
    [],
  )

  const messageStyle = useMemo(
    () => ({
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "white",
      padding: "12px 24px",
      borderRadius: "8px",
      fontSize: "16px",
      fontFamily: "sans-serif",
      pointerEvents: "none" as const,
    }),
    [],
  )

  const isTouchDevice = useMemo(
    () =>
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0),
    [],
  )

  return (
    <div onClick={handleClick} style={overlayStyle}>
      <div style={messageStyle}>
        {isTouchDevice ? "Touch to Interact" : "Click to Interact"}
      </div>
    </div>
  )
}

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

  const circuitJsonKey = useMemo(() => {
    return `${circuitJson?.length || 0}_${(circuitJson as any)?.editCount || 0}`
  }, [circuitJson])

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
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [showSchematicGroups, setShowSchematicGroups] = useState(false)
  const svgDivRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
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
  }, [])

  const [internalEditEvents, setInternalEditEvents] = useState<
    ManualEditEvent[]
  >([])
  const circuitJsonRef = useRef<CircuitJson>(circuitJson)

  useEffect(() => {
    if (
      circuitJsonKey !==
      `${circuitJsonRef.current?.length || 0}_${(circuitJsonRef.current as any)?.editCount || 0}`
    ) {
      setInternalEditEvents([])
      circuitJsonRef.current = circuitJson
    }
  }, [circuitJsonKey, circuitJson])

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
      grid: !debugGrid ? undefined : { cellSize: 1, labelCells: true },
      colorOverrides,
    })
  }, [
    circuitJsonKey,
    containerWidth,
    containerHeight,
    debugGrid,
    colorOverrides,
  ])

  const containerBackgroundColor = useMemo(() => {
    if (!svgString) return "transparent"
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

  const handleEditEvent = useCallback(
    (event: ManualEditEvent) => {
      setInternalEditEvents((prev) => [...prev, event])
      onEditEvent?.(event)
    },
    [onEditEvent],
  )

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

  // Add group overlays when enabled
  useSchematicGroupsOverlay({
    svgDivRef,
    circuitJson,
    circuitJsonKey,
    showGroups: showSchematicGroups,
  })

  const svgDivStyle = useMemo(
    () => ({
      pointerEvents: (clickToInteractEnabled
        ? isInteractionEnabled
          ? "auto"
          : "none"
        : "auto") as const,
      transformOrigin: "0 0" as const,
    }),
    [clickToInteractEnabled, isInteractionEnabled],
  )

  const svgDiv = useMemo(
    () => (
      <div
        ref={svgDivRef}
        style={svgDivStyle}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    ),
    [svgString, svgDivStyle],
  )

  // Memoize event handlers
  const handleWheelCapture = useCallback(
    (e: React.WheelEvent) => {
      if (showSpiceOverlay) {
        e.stopPropagation()
      }
    },
    [showSpiceOverlay],
  )

  const handleMouseDownMain = useCallback(
    (e: React.MouseEvent) => {
      if (clickToInteractEnabled && !isInteractionEnabled) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      handleMouseDown(e)
    },
    [clickToInteractEnabled, isInteractionEnabled, handleMouseDown],
  )

  const handleMouseDownCapture = useCallback(
    (e: React.MouseEvent) => {
      if (clickToInteractEnabled && !isInteractionEnabled) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [clickToInteractEnabled, isInteractionEnabled],
  )

  const handleTouchStartMain = useCallback(
    (e: React.TouchEvent) => {
      if (showSpiceOverlay) return
      handleTouchStart(e)
    },
    [showSpiceOverlay, handleTouchStart],
  )

  const handleTouchEndMain = useCallback(
    (e: React.TouchEvent) => {
      if (showSpiceOverlay) return
      handleTouchEnd(e)
    },
    [showSpiceOverlay, handleTouchEnd],
  )

  // Memoize container style
  const containerStyleMemo = useMemo(
    () => ({
      position: "relative" as const,
      backgroundColor: containerBackgroundColor,
      overflow: "hidden" as const,
      cursor: showSpiceOverlay
        ? "auto"
        : isDragging
          ? "grabbing"
          : clickToInteractEnabled && !isInteractionEnabled
            ? "pointer"
            : "grab",
      minHeight: "300px",
      ...containerStyle,
    }),
    [
      containerBackgroundColor,
      showSpiceOverlay,
      isDragging,
      clickToInteractEnabled,
      isInteractionEnabled,
      containerStyle,
    ],
  )

  return (
    <div
      ref={containerRef}
      style={containerStyleMemo}
      onWheelCapture={handleWheelCapture}
      onMouseDown={handleMouseDownMain}
      onMouseDownCapture={handleMouseDownCapture}
      onTouchStart={handleTouchStartMain}
      onTouchEnd={handleTouchEndMain}
    >
      {!isInteractionEnabled && clickToInteractEnabled && (
        <ClickToInteractOverlay
          onEnable={() => setIsInteractionEnabled(true)}
        />
      )}
      <ViewMenuIcon
        active={showViewMenu}
        onClick={useCallback(
          () => setShowViewMenu(!showViewMenu),
          [showViewMenu],
        )}
      />
      {editingEnabled && (
        <EditIcon
          active={editModeEnabled}
          onClick={useCallback(
            () => setEditModeEnabled(!editModeEnabled),
            [editModeEnabled],
          )}
        />
      )}
      {editingEnabled && editModeEnabled && (
        <GridIcon
          active={snapToGrid}
          onClick={useCallback(() => setSnapToGrid(!snapToGrid), [snapToGrid])}
        />
      )}
      <ViewMenu
        circuitJson={circuitJson}
        circuitJsonKey={circuitJsonKey}
        isVisible={showViewMenu}
        onClose={useCallback(() => setShowViewMenu(false), [])}
        showGroups={showSchematicGroups}
        onToggleGroups={setShowSchematicGroups}
      />
      {spiceSimulationEnabled && (
        <SpiceSimulationIcon
          onClick={useCallback(() => setShowSpiceOverlay(true), [])}
        />
      )}
      {showSpiceOverlay && (
        <SpiceSimulationOverlay
          spiceString={spiceString}
          onClose={useCallback(() => setShowSpiceOverlay(false), [])}
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
