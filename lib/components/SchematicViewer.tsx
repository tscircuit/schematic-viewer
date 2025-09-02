import {
  convertCircuitJsonToSchematicSvg,
  type ColorOverrides,
} from "circuit-to-svg"
import { useChangeSchematicComponentLocationsInSvg } from "lib/hooks/useChangeSchematicComponentLocationsInSvg"
import { useChangeSchematicTracesForMovedComponents } from "lib/hooks/useChangeSchematicTracesForMovedComponents"
import { useSchematicGroupsOverlay } from "lib/hooks/useSchematicGroupsOverlay"
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
import { ViewMenuIcon } from "./ViewMenuIcon"
import { ViewMenu } from "./ViewMenu"
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
  const [spiceSimOptions, setSpiceSimOptions] = useState({
    showVoltage: true,
    showCurrent: false,
    startTime: 0, // in ms
    duration: 20, // in ms
  })

  const getCircuitHash = (circuitJson: CircuitJson) => {
    if (!circuitJson || circuitJson.length === 0) return "empty"
    
    // Create a more stable hash based on actual circuit content
    // Use a fast hash for better performance
    let hash = circuitJson.length.toString()
    
    // Sample key elements to create a representative hash without processing everything
    const sampleSize = Math.min(10, circuitJson.length)
    for (let i = 0; i < sampleSize; i++) {
      const item = circuitJson[i]
      if (item) {
        const type = item.type
        const id = (item as any).source_component_id || 
                  (item as any).schematic_component_id || 
                  (item as any).source_group_id || 
                  (item as any).schematic_trace_id || 
                  i.toString()
        hash += `_${type}:${id}`
      }
    }
    
    // If there are more items, add a summary
    if (circuitJson.length > sampleSize) {
      const typesCounts = new Map<string, number>()
      for (const item of circuitJson) {
        typesCounts.set(item.type, (typesCounts.get(item.type) || 0) + 1)
      }
      hash += `_summary:${Array.from(typesCounts.entries()).map(([k, v]) => `${k}=${v}`).join(",")}`
    }
    
    return hash
  }

  const circuitJsonKey = useMemo(
    () => getCircuitHash(circuitJson),
    [circuitJson],
  )

  const spiceString = useMemo(() => {
    if (!spiceSimulationEnabled) return null
    try {
      return getSpiceFromCircuitJson(circuitJson, spiceSimOptions)
    } catch (e) {
      console.error("Failed to generate SPICE string", e)
      return null
    }
  }, [
    circuitJsonKey,
    spiceSimulationEnabled,
    spiceSimOptions.startTime,
    spiceSimOptions.duration,
    spiceSimOptions.showVoltage,
    spiceSimOptions.showCurrent,
  ])

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
  
  // Throttle container dimensions to avoid excessive re-renders on small changes
  const stableContainerDimensions = useMemo(() => {
    if (!containerWidth || !containerHeight) return { width: 0, height: 0 }
    
    // Round to nearest 10px to avoid micro-adjustments causing re-renders
    const stableWidth = Math.round(containerWidth / 10) * 10
    const stableHeight = Math.round(containerHeight / 10) * 10
    
    return { width: stableWidth, height: stableHeight }
  }, [containerWidth, containerHeight])
  
  const svgString = useMemo(() => {
    if (!stableContainerDimensions.width || !stableContainerDimensions.height) return ""

    return convertCircuitJsonToSchematicSvg(circuitJson as any, {
      width: stableContainerDimensions.width,
      height: stableContainerDimensions.height || 720,
      grid: !debugGrid
        ? undefined
        : {
            cellSize: 1,
            labelCells: true,
          },
      colorOverrides,
    })
  }, [circuitJsonKey, stableContainerDimensions.width, stableContainerDimensions.height, debugGrid, colorOverrides])

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

  // Add group overlays when enabled
  useSchematicGroupsOverlay({
    svgDivRef,
    circuitJson,
    circuitJsonKey,
    showGroups: showSchematicGroups,
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
      <ViewMenuIcon
        active={showViewMenu}
        onClick={() => setShowViewMenu(!showViewMenu)}
      />
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
      <ViewMenu
        circuitJson={circuitJson}
        circuitJsonKey={circuitJsonKey}
        isVisible={showViewMenu}
        onClose={() => setShowViewMenu(false)}
        showGroups={showSchematicGroups}
        onToggleGroups={setShowSchematicGroups}
      />
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
          simOptions={spiceSimOptions}
          onSimOptionsChange={setSpiceSimOptions}
        />
      )}
      {svgDiv}
    </div>
  )
}
