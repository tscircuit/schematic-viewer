import { su } from "@tscircuit/soup-util"
import type { CircuitJson, SchematicSheet } from "circuit-json"
import {
  type ColorOverrides,
  convertCircuitJsonToSchematicSvg,
} from "circuit-to-svg"
import {
  STORAGE_KEYS,
  getStoredBoolean,
  getStoredString,
  setStoredBoolean,
  setStoredString,
} from "lib/hooks/useLocalStorage"
import { useSchematicGroupsOverlay } from "lib/hooks/useSchematicGroupsOverlay"
import { useSchematicNetHover } from "lib/hooks/useSchematicNetHover"
import { useSchematicSearch } from "lib/hooks/useSchematicSearch"
import { enableDebug } from "lib/utils/debug"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toString as transformToString } from "transformation-matrix"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { useResizeHandling } from "../hooks/use-resize-handling"
import { useContextMenu } from "../hooks/useContextMenu"
import { getSchematicComponentDetails } from "../utils/component-details"
import { zIndexMap } from "../utils/z-index-map"
import { MouseTracker } from "./MouseTracker"
import { SchematicComponentDetailsTooltip } from "./SchematicComponentDetailsTooltip"
import { SchematicComponentMouseTarget } from "./SchematicComponentMouseTarget"
import { SchematicPortMouseTarget } from "./SchematicPortMouseTarget"
import { SchematicSearch } from "./SchematicSearch"
import { SchematicSheetSelector } from "./SchematicSheetSelector"
import { ViewMenu } from "./ViewMenu"

interface Props {
  circuitJson: CircuitJson
  containerStyle?: React.CSSProperties
  debugGrid?: boolean
  debug?: boolean
  clickToInteractEnabled?: boolean
  colorOverrides?: ColorOverrides
  disableGroups?: boolean
  /** Fade unrelated nets/chips when hovering a wire or net label. Default true. */
  netHoverHighlightEnabled?: boolean
  css?: string
  className?: string
  onSchematicComponentClicked?: (options: {
    schematicComponentId: string
    event: MouseEvent
  }) => void
  showSchematicPorts?: boolean
  onSchematicPortClicked?: (options: {
    schematicPortId: string
    event: MouseEvent
  }) => void
  /** Called when the active schematic sheet changes (multi-sheet circuits). */
  onSchematicSheetChange?: (schematicSheetId: string) => void
  /** Show component and net-label search. Default true. */
  searchEnabled?: boolean
}

interface SelectedSchematicComponent {
  schematicComponentId: string
  anchorX: number
  anchorY: number
}

export const SchematicViewer = ({
  circuitJson,
  containerStyle,
  debugGrid = false,
  debug = false,
  clickToInteractEnabled = false,
  colorOverrides,
  disableGroups = false,
  netHoverHighlightEnabled = true,
  onSchematicComponentClicked,
  showSchematicPorts,
  onSchematicPortClicked,
  onSchematicSheetChange,
  searchEnabled = true,
  css,
  className,
}: Props) => {
  if (debug) {
    enableDebug()
  }

  const getCircuitHash = (circuitJson: CircuitJson) => {
    return `${circuitJson?.length || 0}_${(circuitJson as any)?.editCount || 0}`
  }

  const circuitJsonKey = useMemo(
    () => getCircuitHash(circuitJson),
    [circuitJson],
  )

  // Schematic sheets present in the circuit, sorted by sheet_index. A circuit
  // may have zero (single implicit sheet), one, or many sheets.
  const schematicSheets = useMemo<SchematicSheet[]>(() => {
    try {
      return (circuitJson as any[])
        .filter((elm) => elm?.type === "schematic_sheet")
        .slice()
        .sort((a, b) => (a.sheet_index ?? 0) - (b.sheet_index ?? 0))
    } catch (err) {
      console.error("Failed to derive schematic sheets", err)
      return []
    }
  }, [circuitJsonKey])

  const hasMultipleSheets = schematicSheets.length > 1
  const defaultSheetId = schematicSheets[0]?.schematic_sheet_id

  const [selectedSheetId, setSelectedSheetId] = useState<string | undefined>(
    () => {
      // Restore the last-viewed sheet from localStorage so it survives reloads.
      const stored = getStoredString(STORAGE_KEYS.SELECTED_SCHEMATIC_SHEET)
      if (
        stored &&
        schematicSheets.some((s) => s.schematic_sheet_id === stored)
      ) {
        return stored
      }
      return defaultSheetId
    },
  )

  // Keep the selection valid as the circuit changes: fall back to the default
  // sheet if the previously-selected sheet no longer exists.
  useEffect(() => {
    const stillExists =
      selectedSheetId !== undefined &&
      schematicSheets.some((s) => s.schematic_sheet_id === selectedSheetId)
    if (!stillExists) {
      setSelectedSheetId(defaultSheetId)
    }
  }, [circuitJsonKey])

  // The sheet that should actually be rendered. When there is a single sheet
  // (or none) we leave this undefined so circuit-to-svg uses its default and
  // behavior is unchanged for single-sheet circuits.
  const activeSheetId = hasMultipleSheets
    ? (selectedSheetId ?? defaultSheetId)
    : undefined

  const handleSelectSheet = useCallback(
    (sheetId: string) => {
      setSelectedSheetId(sheetId)
      setStoredString(STORAGE_KEYS.SELECTED_SCHEMATIC_SHEET, sheetId)
      onSchematicSheetChange?.(sheetId)
    },
    [onSchematicSheetChange],
  )

  const [showGridInternal, setShowGridInternal] = useState(false)
  const showGrid = debugGrid || showGridInternal
  const [isInteractionEnabled, setIsInteractionEnabled] = useState<boolean>(
    !clickToInteractEnabled,
  )
  const [showSchematicGroups, setShowSchematicGroups] = useState(() => {
    if (disableGroups) return false
    return getStoredBoolean(STORAGE_KEYS.IS_SHOWING_SCHEMATIC_GROUPS, false)
  })
  const [showSchematicPortsInternal, setShowSchematicPortsInternal] = useState(
    () =>
      showSchematicPorts ??
      getStoredBoolean(STORAGE_KEYS.IS_SHOWING_SCHEMATIC_PORTS, false),
  )

  useEffect(() => {
    if (showSchematicPorts !== undefined) {
      setShowSchematicPortsInternal(showSchematicPorts)
    }
  }, [showSchematicPorts])
  const [isHoveringClickableComponent, setIsHoveringClickableComponent] =
    useState(false)
  const hoveringComponentsRef = useRef<Set<string>>(new Set())
  const [selectedSchematicComponent, setSelectedSchematicComponent] =
    useState<SelectedSchematicComponent | null>(null)

  const handleComponentHoverChange = useCallback(
    (componentId: string, isHovering: boolean) => {
      if (isHovering) {
        hoveringComponentsRef.current.add(componentId)
      } else {
        hoveringComponentsRef.current.delete(componentId)
      }
      setIsHoveringClickableComponent(hoveringComponentsRef.current.size > 0)
    },
    [],
  )

  const [isHoveringClickablePort, setIsHoveringClickablePort] = useState(false)
  const hoveringPortsRef = useRef<Set<string>>(new Set())

  const handlePortHoverChange = useCallback(
    (portId: string, isHovering: boolean) => {
      if (isHovering) {
        hoveringPortsRef.current.add(portId)
      } else {
        hoveringPortsRef.current.delete(portId)
      }
      setIsHoveringClickablePort(hoveringPortsRef.current.size > 0)
    },
    [],
  )

  const svgDivRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const zoomScaleRef = useRef({ x: 1, y: 1 })

  const schematicComponentIds = useMemo(() => {
    try {
      const components = su(circuitJson).schematic_component?.list() ?? []
      return components
        .filter(
          (component) =>
            !activeSheetId || component.schematic_sheet_id === activeSheetId,
        )
        .map((component) => component.schematic_component_id as string)
    } catch (err) {
      console.error("Failed to derive schematic component ids", err)
      return []
    }
  }, [circuitJsonKey, circuitJson, activeSheetId])

  const schematicPortsInfo = useMemo(() => {
    if (!showSchematicPortsInternal) return []
    try {
      const ports = (su(circuitJson).schematic_port?.list() ?? []).filter(
        (port) => !activeSheetId || port.schematic_sheet_id === activeSheetId,
      )
      return ports.map((port) => {
        const sourcePort = su(circuitJson).source_port.get(port.source_port_id)
        const sourceComponent = sourcePort?.source_component_id
          ? su(circuitJson).source_component.get(sourcePort.source_component_id)
          : null
        const componentName = sourceComponent?.name ?? "?"
        const pinLabel =
          port.display_pin_label ??
          (sourcePort as any)?.pin_number ??
          (sourcePort as any)?.name ??
          "?"
        return {
          portId: port.source_port_id as string,
          label: `${componentName}.${pinLabel}`,
        }
      })
    } catch (err) {
      console.error("Failed to derive schematic port info", err)
      return []
    }
  }, [circuitJsonKey, circuitJson, showSchematicPortsInternal, activeSheetId])

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

  const shouldPanSchematic = useCallback(
    (event: MouseEvent | TouchEvent | WheelEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-schematic-search]")
      ) {
        return false
      }
      if (event.type !== "mousedown" || !("button" in event)) return true
      return event.button !== 2 && !(event.button === 0 && event.ctrlKey)
    },
    [],
  )

  const {
    ref: containerRef,
    transform: svgToScreenProjection,
    setTransform: setSvgToScreenProjection,
  } = useMouseMatrixTransform({
    onSetTransform(transform) {
      const zoomChanged =
        transform.a !== zoomScaleRef.current.x ||
        transform.d !== zoomScaleRef.current.y
      zoomScaleRef.current = { x: transform.a, y: transform.d }
      if (zoomChanged) {
        setSelectedSchematicComponent(null)
      }
      if (!svgDivRef.current) return
      svgDivRef.current.style.transform = transformToString(transform)
    },
    // @ts-ignore disabled is a valid prop but not typed
    enabled: isInteractionEnabled,
    shouldDrag: shouldPanSchematic,
  })

  const {
    menuVisible,
    menuPos,
    menuRef,
    setMenuVisible,
    contextMenuEventHandlers,
  } = useContextMenu({ containerRef })

  const { containerWidth, containerHeight } = useResizeHandling(containerRef)
  const selectedComponentDetails = useMemo(
    () =>
      selectedSchematicComponent
        ? getSchematicComponentDetails(
            circuitJson,
            selectedSchematicComponent.schematicComponentId,
          )
        : null,
    [circuitJsonKey, circuitJson, selectedSchematicComponent],
  )

  const componentTooltipLayout = useMemo(() => {
    if (!selectedSchematicComponent || !containerWidth || !containerHeight) {
      return null
    }

    const margin = 12
    const gap = 14
    const width = Math.min(420, containerWidth - margin * 2)
    const maxHeight = Math.min(520, containerHeight - margin * 2)
    const { anchorX, anchorY } = selectedSchematicComponent

    const rightOfAnchor = anchorX + gap
    const leftOfAnchor = anchorX - width - gap
    const left =
      rightOfAnchor + width <= containerWidth - margin
        ? rightOfAnchor
        : leftOfAnchor >= margin
          ? leftOfAnchor
          : Math.max(
              margin,
              Math.min(anchorX - width / 2, containerWidth - width - margin),
            )
    const top = Math.max(
      margin,
      Math.min(anchorY - 24, containerHeight - maxHeight - margin),
    )

    return { left, top, width, maxHeight }
  }, [selectedSchematicComponent, containerWidth, containerHeight])

  const handleSchematicComponentClick = useCallback(
    (schematicComponentId: string, event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-schematic-component-details-tooltip]")
      ) {
        return
      }

      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      setSelectedSchematicComponent({
        schematicComponentId,
        anchorX: event.clientX - containerRect.left,
        anchorY: event.clientY - containerRect.top,
      })
      onSchematicComponentClicked?.({
        schematicComponentId,
        event,
      })
    },
    [containerRef, onSchematicComponentClicked],
  )

  useEffect(() => {
    setSelectedSchematicComponent(null)
  }, [circuitJsonKey, activeSheetId])

  useEffect(() => {
    if (!selectedSchematicComponent) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedSchematicComponent(null)
      }
    }
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-schematic-component-details-tooltip]")
      ) {
        return
      }
      setSelectedSchematicComponent(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleDocumentMouseDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleDocumentMouseDown)
    }
  }, [selectedSchematicComponent])

  const svgString = useMemo(() => {
    if (!containerWidth || !containerHeight) return ""

    return convertCircuitJsonToSchematicSvg(circuitJson as any, {
      width: containerWidth,
      height: containerHeight || 720,
      drawPorts: showSchematicPortsInternal,
      schematicSheetId: activeSheetId,
      grid: !showGrid
        ? undefined
        : {
            cellSize: 1,
            labelCells: true,
          },
      colorOverrides,
      css,
      className,
    })
  }, [
    circuitJsonKey,
    containerWidth,
    containerHeight,
    showGrid,
    showSchematicPortsInternal,
    activeSheetId,
  ])

  const containerBackgroundColor = useMemo(() => {
    const match = svgString.match(
      /<svg[^>]*style="[^"]*background-color:\s*([^;\"]+)/i,
    )
    return match?.[1] ?? "transparent"
  }, [svgString])

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    handleSearchResultSelect,
    handleCancelSearch,
  } = useSchematicSearch({
    circuitJson,
    circuitJsonKey,
    svgDivRef,
    containerRef,
    activeSheetId,
    hasMultipleSheets,
    handleSelectSheet,
    svgString,
    svgToScreenProjection,
    setSvgToScreenProjection,
    setIsInteractionEnabled,
  })

  // Add group overlays when enabled. The key includes the active sheet so
  // overlays are recomputed against the freshly-rendered sheet's SVG.
  useSchematicGroupsOverlay({
    svgDivRef,
    circuitJson,
    circuitJsonKey: `${circuitJsonKey}_${activeSheetId ?? ""}`,
    showGroups: showSchematicGroups && !disableGroups,
  })

  // Fade unrelated nets/chips when hovering a wire or net label (JS-driven; the
  // base SVG carries no interaction).
  useSchematicNetHover({
    svgDivRef,
    circuitJson,
    circuitJsonKey: `${circuitJsonKey}_${activeSheetId ?? ""}`,
    enabled: netHoverHighlightEnabled,
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
        className="schematic-component-clickable"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    ),
    [svgString, isInteractionEnabled, clickToInteractEnabled],
  )

  return (
    <MouseTracker>
      {netHoverHighlightEnabled && (
        <style>
          {`.sch-net-faded { opacity: 0.35; }
            svg :is(g.trace, g.trace-overlays, g[data-schematic-component-id], [data-schematic-net-label-id], [data-schematic-text-id]) { transition: opacity 0.12s ease-in-out; }`}
        </style>
      )}
      {searchEnabled && (
        <style>
          {`.schematic-search-match text,
            text.schematic-search-match {
              fill: #ff00d4 !important;
            }
            .schematic-search-match [stroke]:not(text):not([stroke="none"]),
            [stroke]:not(text):not([stroke="none"]).schematic-search-match {
              stroke: #ff00d4 !important;
            }
            .schematic-viewer-toolbar {
              flex-direction: row;
            }
            @media (max-width: 640px) {
              .schematic-viewer-toolbar {
                flex-direction: column;
              }
            }`}
        </style>
      )}
      <style>
        {
          ".schematic-component-clickable [data-schematic-component-id]:hover { cursor: pointer !important; }"
        }
      </style>
      {onSchematicPortClicked && (
        <style>
          {"[data-schematic-port-id]:hover { cursor: pointer !important; }"}
        </style>
      )}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          backgroundColor: containerBackgroundColor,
          overflow: "hidden",
          cursor:
            clickToInteractEnabled && !isInteractionEnabled
              ? "pointer"
              : isHoveringClickableComponent
                ? "pointer"
                : isHoveringClickablePort && onSchematicPortClicked
                  ? "pointer"
                  : "grab",
          minHeight: "300px",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          ...containerStyle,
        }}
        onMouseDownCapture={(e) => {
          contextMenuEventHandlers.onMouseDown(e)
          if (clickToInteractEnabled && !isInteractionEnabled) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
        }}
        onContextMenu={contextMenuEventHandlers.onContextMenu}
        onTouchStart={(event) => {
          handleTouchStart(event)
          contextMenuEventHandlers.onTouchStart(event)
        }}
        onTouchMove={contextMenuEventHandlers.onTouchMove}
        onTouchEnd={(event) => {
          handleTouchEnd(event)
          contextMenuEventHandlers.onTouchEnd()
        }}
        onTouchCancel={contextMenuEventHandlers.onTouchCancel}
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
        {menuVisible && (
          <ViewMenu
            circuitJson={circuitJson}
            circuitJsonKey={circuitJsonKey}
            menuRef={menuRef}
            menuPos={menuPos}
            onOpenChange={setMenuVisible}
            showPorts={showSchematicPortsInternal}
            onTogglePorts={(value) => {
              setShowSchematicPortsInternal(value)
              setStoredBoolean(STORAGE_KEYS.IS_SHOWING_SCHEMATIC_PORTS, value)
            }}
            showGroups={showSchematicGroups}
            onToggleGroups={(value) => {
              if (!disableGroups) {
                setShowSchematicGroups(value)
                setStoredBoolean(
                  STORAGE_KEYS.IS_SHOWING_SCHEMATIC_GROUPS,
                  value,
                )
              }
            }}
            showGrid={showGrid}
            onToggleGrid={setShowGridInternal}
          />
        )}
        <div
          className="schematic-viewer-toolbar"
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            zIndex: zIndexMap.schematicSearch,
          }}
        >
          <SchematicSheetSelector
            sheets={schematicSheets}
            selectedSheetId={activeSheetId}
            onSelectSheet={handleSelectSheet}
          />
          {searchEnabled && (
            <SchematicSearch
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onCancel={handleCancelSearch}
              results={searchResults}
              onSelect={handleSearchResultSelect}
              viewerContainerRef={containerRef}
            />
          )}
        </div>
        {schematicComponentIds.map((componentId) => (
          <SchematicComponentMouseTarget
            key={componentId}
            componentId={componentId}
            svgDivRef={svgDivRef}
            containerRef={containerRef}
            showOutline={true}
            circuitJsonKey={circuitJsonKey}
            onHoverChange={handleComponentHoverChange}
            onComponentClick={handleSchematicComponentClick}
          />
        ))}
        {svgDiv}
        {selectedComponentDetails && componentTooltipLayout && (
          <SchematicComponentDetailsTooltip
            sourceComponent={selectedComponentDetails.sourceComponent}
            footprinterString={selectedComponentDetails.footprinterString}
            footprintPreviewCircuitJson={
              selectedComponentDetails.footprintPreviewCircuitJson
            }
            footprintPreviewViewBox={
              selectedComponentDetails.footprintPreviewViewBox
            }
            {...componentTooltipLayout}
          />
        )}
        {showSchematicPortsInternal &&
          schematicPortsInfo.map(({ portId, label }) => (
            <SchematicPortMouseTarget
              key={portId}
              portId={portId}
              portLabel={label}
              svgDivRef={svgDivRef}
              containerRef={containerRef}
              showOutline={true}
              circuitJsonKey={circuitJsonKey}
              onHoverChange={handlePortHoverChange}
              onPortClick={
                onSchematicPortClicked
                  ? (id, event) => {
                      onSchematicPortClicked?.({
                        schematicPortId: id,
                        event,
                      })
                    }
                  : undefined
              }
            />
          ))}
      </div>
    </MouseTracker>
  )
}
