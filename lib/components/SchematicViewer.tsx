import {
  convertCircuitJsonToSchematicSvg,
  type ColorOverrides,
} from "circuit-to-svg"
import { su } from "@tscircuit/soup-util"
import { useChangeSchematicComponentLocationsInSvg } from "lib/hooks/useChangeSchematicComponentLocationsInSvg"
import { useChangeSchematicTracesForMovedComponents } from "lib/hooks/useChangeSchematicTracesForMovedComponents"
import { useSchematicGroupsOverlay } from "lib/hooks/useSchematicGroupsOverlay"
import { useSchematicNetHover } from "lib/hooks/useSchematicNetHover"
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
import { ViewMenu } from "./ViewMenu"
import type { CircuitJson, SchematicSheet } from "circuit-json"
import { SpiceSimulationIcon } from "./SpiceSimulationIcon"
import { SpiceSimulationOverlay } from "./SpiceSimulationOverlay"
import { zIndexMap } from "../utils/z-index-map"
import { useSpiceSimulation } from "../hooks/useSpiceSimulation"
import { getSpiceFromCircuitJson } from "../utils/spice-utils"
import {
  getStoredBoolean,
  setStoredBoolean,
  getStoredString,
  setStoredString,
  STORAGE_KEYS,
} from "lib/hooks/useLocalStorage"
import { MouseTracker } from "./MouseTracker"
import { SchematicComponentMouseTarget } from "./SchematicComponentMouseTarget"
import { SchematicPortMouseTarget } from "./SchematicPortMouseTarget"
import { SchematicSheetSelector } from "./SchematicSheetSelector"
import { useWireDrawing } from "../hooks/useWireDrawing"
import { useBusDrawing } from "../hooks/useBusDrawing"
import { useBusEntryPlacement } from "../hooks/useBusEntryPlacement"
import { useNoConnectPlacement } from "../hooks/useNoConnectPlacement"
import { useNetLabelPlacement } from "../hooks/useNetLabelPlacement"
import { useGlobalLabelPlacement } from "../hooks/useGlobalLabelPlacement"
import { useHierSheetPlacement } from "../hooks/useHierSheetPlacement"
import { WirePreview } from "./WirePreview"
import { BusPreview } from "./BusPreview"
import { BusEntryPreview } from "./BusEntryPreview"
import { NoConnectPreview } from "./NoConnectPreview"
import { NetLabelPreview } from "./NetLabelPreview"
import { GlobalLabelPreview } from "./GlobalLabelPreview"
import { HierSheetPreview, type HierSheetTarget } from "./HierSheetPreview"
import { isSpacePanHeld, setSpacePanHeld } from "lib/hooks/useLocalStorage"
import { usePowerPortPlacement } from "../hooks/usePowerPortPlacement"
import { PowerPortPreview } from "./PowerPortPreview"
import type { EditSchematicPowerPortAddEvent } from "../types/edit-events"
import { useGroundPortPlacement } from "../hooks/useGroundPortPlacement"
import { GroundPortPreview } from "./GroundPortPreview"
import type { EditSchematicGroundPortAddEvent } from "../types/edit-events"
import { useTextNotePlacement } from "../hooks/useTextNotePlacement"
import { TextNotePreview } from "./TextNotePreview"
import type { EditSchematicTextNoteAddEvent } from "../types/edit-events"
import { useTraceDrawing } from "../hooks/useTraceDrawing"
import { useComponentPlacement } from "../hooks/useComponentPlacement"
import { ComponentPlacementPreview } from "./ComponentPlacementPreview"
import type {
  EditSchematicComponentAddEvent,
  PlacementComponentKind,
} from "../types/edit-events"
import type {
  EditSchematicBusAddEvent,
  EditSchematicBusEntryAddEvent,
  EditSchematicGlobalLabelAddEvent,
  EditSchematicHierSheetAddEvent,
  EditSchematicNetLabelAddEvent,
  EditSchematicNoConnectAddEvent,
  EditSchematicWireAddEvent,
} from "../types/edit-events"

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
  toolMode?:
    | "select"
    | "draw_wire"
    | "draw_bus"
    | "draw_bus_entry"
    | "draw_no_connect"
    | "draw_net_label"
    | "draw_global_label"
    | "draw_hier_sheet"
    | "draw_power_port"
    | "draw_ground_port"
    | "draw_text_note"
    | "draw_trace"
    | "draw_component"
  onWireAdded?: (event: EditSchematicWireAddEvent) => void
  onBusAdded?: (event: EditSchematicBusAddEvent) => void
  onBusEntryAdded?: (event: EditSchematicBusEntryAddEvent) => void
  onNoConnectAdded?: (event: EditSchematicNoConnectAddEvent) => void
  onNetLabelAdded?: (event: EditSchematicNetLabelAddEvent) => void
  onGlobalLabelAdded?: (event: EditSchematicGlobalLabelAddEvent) => void
  onHierSheetAdded?: (event: EditSchematicHierSheetAddEvent) => void
  onPowerPortAdded?: (event: EditSchematicPowerPortAddEvent) => void
  onGroundPortAdded?: (event: EditSchematicGroundPortAddEvent) => void
  onTextNoteAdded?: (event: EditSchematicTextNoteAddEvent) => void
  onComponentAdded?: (event: EditSchematicComponentAddEvent) => void
  placementComponentKind?: PlacementComponentKind
  hierSheetTargets?: HierSheetTarget[]
  /** Host sheet id excluded from hier-sheet placement targets. */
  activeSheetId?: string
  allowComponentEdit?: boolean
  allowCanvasPan?: boolean
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
  disableGroups = false,
  netHoverHighlightEnabled = true,
  onSchematicComponentClicked,
  showSchematicPorts = false,
  onSchematicPortClicked,
  onSchematicSheetChange,
  css,
  className,
  toolMode = "select",
  onWireAdded,
  onBusAdded,
  onBusEntryAdded,
  onNoConnectAdded,
  onNetLabelAdded,
  onGlobalLabelAdded,
  onHierSheetAdded,
  onPowerPortAdded,
  onGroundPortAdded,
  onTextNoteAdded,
  onComponentAdded,
  placementComponentKind = "resistor",
  hierSheetTargets = [],
  activeSheetId,
  allowComponentEdit = false,
  allowCanvasPan = true,
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
  const selectedSchematicSheetId = hasMultipleSheets
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
  ])

  const [hasSpiceSimRun, setHasSpiceSimRun] = useState(false)

  useEffect(() => {
    setHasSpiceSimRun(false)
  }, [circuitJsonKey])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      const t = e.target
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return
      setSpacePanHeld(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpacePanHeld(false)
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      setSpacePanHeld(false)
    }
  }, [])

  const {
    plotData,
    nodes,
    isLoading: isSpiceSimLoading,
    error: spiceSimError,
  } = useSpiceSimulation(hasSpiceSimRun ? spiceString : null)

  const [editModeEnabled, setEditModeEnabled] = useState(defaultEditMode)
  const effectiveEditMode = toolMode === "select" && editModeEnabled

  useEffect(() => {
    if (
      toolMode === "draw_wire" ||
      toolMode === "draw_bus" ||
      toolMode === "draw_bus_entry" ||
      toolMode === "draw_no_connect" ||
      toolMode === "draw_net_label" ||
      toolMode === "draw_global_label" ||
      toolMode === "draw_hier_sheet" ||
      toolMode === "draw_power_port" ||
      toolMode === "draw_ground_port" ||
      toolMode === "draw_text_note"
    ) {
      setEditModeEnabled(false)
    } else if (toolMode === "select" && defaultEditMode) {
      setEditModeEnabled(true)
    } else {
      setEditModeEnabled(false)
    }
  }, [toolMode, defaultEditMode])
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showGridInternal, setShowGridInternal] = useState(false)
  const showGrid = debugGrid || showGridInternal
  const [isInteractionEnabled, setIsInteractionEnabled] = useState<boolean>(
    !clickToInteractEnabled,
  )
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [showSchematicGroups, setShowSchematicGroups] = useState(() => {
    if (disableGroups) return false
    return getStoredBoolean("schematic_viewer_show_groups", false)
  })
  const [isHoveringClickableComponent, setIsHoveringClickableComponent] =
    useState(false)
  const hoveringComponentsRef = useRef<Set<string>>(new Set())

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

  const schematicComponentIds = useMemo(() => {
    try {
      const components = su(circuitJson).schematic_component?.list() ?? []
      return components
        .filter(
          (component) =>
            !selectedSchematicSheetId ||
            (component as any).schematic_sheet_id === selectedSchematicSheetId,
        )
        .map((component) => component.schematic_component_id as string)
    } catch (err) {
      console.error("Failed to derive schematic component ids", err)
      return []
    }
  }, [circuitJsonKey, circuitJson, selectedSchematicSheetId])

  const schematicPortsInfo = useMemo(() => {
    if (!showSchematicPorts) return []
    try {
      const ports = (su(circuitJson).schematic_port?.list() ?? []).filter(
        (port) =>
          !selectedSchematicSheetId ||
          (port as any).schematic_sheet_id === selectedSchematicSheetId,
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
          portId: port.schematic_port_id as string,
          label: `${componentName}.${pinLabel}`,
        }
      })
    } catch (err) {
      console.error("Failed to derive schematic port info", err)
      return []
    }
  }, [circuitJsonKey, circuitJson, showSchematicPorts, selectedSchematicSheetId])

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

  const panPolicyRef = useRef({ toolMode, allowComponentEdit, allowCanvasPan })
  panPolicyRef.current = { toolMode, allowComponentEdit, allowCanvasPan }

  const onSetSvgTransform = useCallback((transform: Parameters<typeof transformToString>[0]) => {
    if (!svgDivRef.current) return
    svgDivRef.current.style.transform = transformToString(transform)
  }, [])

  const shouldDrag = useCallback((e: MouseEvent | TouchEvent | WheelEvent) => {
    if (e.type === "wheel") return true
    // Hit-target checks only on mousedown; re-checking on move/up stops pan mid-drag
    if (e.type === "mousemove" || e.type === "mouseup" || e.type === "mouseout") {
      return true
    }

    if (e instanceof MouseEvent && e.button !== 0) return true
    if (isSpacePanHeld() && e instanceof MouseEvent) return true

    const { toolMode: mode, allowComponentEdit: allowEdit, allowCanvasPan: pan } =
      panPolicyRef.current

    if (!pan && e.type !== "wheel") {
      return false
    }

    if (
      mode === "draw_wire" ||
      mode === "draw_trace" ||
      mode === "draw_component" ||
      mode === "draw_bus" ||
      mode === "draw_bus_entry" ||
      mode === "draw_no_connect" ||
      mode === "draw_net_label" ||
      mode === "draw_global_label" ||
      mode === "draw_hier_sheet" ||
      mode === "draw_power_port" ||
      mode === "draw_ground_port" ||
      mode === "draw_text_note"
    ) {
      return false
    }

    if (allowEdit) {
      const target = e.target as Element
      if (target.closest('[data-circuit-json-type="schematic_component"]')) {
        return false
      }
    }

    return true
  }, [])

  const {
    ref: containerRef,
    cancelDrag,
    transform: svgToScreenProjection,
  } = useMouseMatrixTransform({
    onSetTransform: onSetSvgTransform,
    // @ts-ignore disabled is a valid prop but not typed
    enabled: isInteractionEnabled && !showSpiceOverlay,
    shouldDrag,
  })

  const { containerWidth, containerHeight } = useResizeHandling(containerRef)
  const svgString = useMemo(() => {
    if (!containerWidth || !containerHeight) return ""

    return convertCircuitJsonToSchematicSvg(
      circuitJson as any,
      {
        width: containerWidth,
        height: containerHeight || 720,
        drawPorts: showSchematicPorts,
        schematicSheetId: selectedSchematicSheetId,
        grid: !showGrid
          ? undefined
          : {
              cellSize: 1,
              labelCells: true,
            },
        colorOverrides,
        css,
        className,
      } as any,
    )
  }, [
    circuitJsonKey,
    circuitJson,
    containerWidth,
    containerHeight,
    showGrid,
    colorOverrides,
    css,
    className,
    showSchematicPorts,
    selectedSchematicSheetId,
  ])

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

  const {
    handleMouseDown,
    handleTouchStart: handleComponentTouchStart,
    isDragging,
    activeEditEvent,
  } = useComponentDragging({
    onEditEvent: handleEditEvent,
    cancelDrag,
    realToSvgProjection,
    svgToScreenProjection,
    circuitJson,
    editEvents: editEventsWithUnappliedEditEvents,
    enabled: allowComponentEdit && isInteractionEnabled && !showSpiceOverlay,
    snapToGrid,
  })

  const isProjectionReady =
    svgToScreenProjection?.a != null &&
    !isNaN(svgToScreenProjection.a) &&
    realToSvgProjection?.a != null &&
    !isNaN(realToSvgProjection.a)

  const { wireDrawingState, handlePortMouseDown } = useWireDrawing({
    enabled:
      toolMode === "draw_wire" && isInteractionEnabled && isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onWireAdded,
  })

  const { wireDrawingState: tracePreviewState, handlePortMouseDown: handleTracePortMouseDown } =
    useTraceDrawing({
      enabled:
        toolMode === "draw_trace" && isInteractionEnabled && isProjectionReady,
      circuitJson,
      svgToScreenProjection,
      realToSvgProjection,
      containerRef,
      onEditEvent: onWireAdded,
    })

  const { componentPlacementState } = useComponentPlacement({
    enabled:
      toolMode === "draw_component" && isInteractionEnabled && isProjectionReady,
    componentKind: placementComponentKind,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onComponentAdded,
  })

  const portMouseDownHandler =
    toolMode === "draw_trace" ? handleTracePortMouseDown : handlePortMouseDown
  const activeWirePreviewState =
    toolMode === "draw_trace" ? tracePreviewState : wireDrawingState

  const { busDrawingState } = useBusDrawing({
    enabled:
      toolMode === "draw_bus" && isInteractionEnabled && isProjectionReady,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onBusAdded,
  })

  const { busEntryPreviewState } = useBusEntryPlacement({
    enabled:
      toolMode === "draw_bus_entry" &&
      isInteractionEnabled &&
      isProjectionReady,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onBusEntryAdded,
  })

  const { noConnectPreviewState } = useNoConnectPlacement({
    enabled:
      toolMode === "draw_no_connect" &&
      isInteractionEnabled &&
      isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onNoConnectAdded,
  })

  const { netLabelState, confirmPlacement, cancelPlacement } =
    useNetLabelPlacement({
      enabled:
        toolMode === "draw_net_label" &&
        isInteractionEnabled &&
        isProjectionReady,
      circuitJson,
      svgToScreenProjection,
      realToSvgProjection,
      containerRef,
      onEditEvent: onNetLabelAdded,
    })

  const {
    globalLabelState,
    confirmPlacement: confirmGlobalPlacement,
    cancelPlacement: cancelGlobalPlacement,
  } = useGlobalLabelPlacement({
    enabled:
      toolMode === "draw_global_label" &&
      isInteractionEnabled &&
      isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onGlobalLabelAdded,
  })

  const {
    powerPortState,
    confirmPlacement: confirmPowerPlacement,
    cancelPlacement: cancelPowerPlacement,
  } = usePowerPortPlacement({
    enabled:
      toolMode === "draw_power_port" &&
      isInteractionEnabled &&
      isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onPowerPortAdded,
  })

  const {
    groundPortState,
    confirmPlacement: confirmGroundPlacement,
    cancelPlacement: cancelGroundPlacement,
  } = useGroundPortPlacement({
    enabled:
      toolMode === "draw_ground_port" &&
      isInteractionEnabled &&
      isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onGroundPortAdded,
  })

  const {
    textNoteState,
    confirmPlacement: confirmTextNotePlacement,
    cancelPlacement: cancelTextNotePlacement,
  } = useTextNotePlacement({
    enabled:
      toolMode === "draw_text_note" &&
      isInteractionEnabled &&
      isProjectionReady,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onTextNoteAdded,
  })

  const {
    hierSheetState,
    confirmPlacement: confirmHierSheetPlacement,
    cancelPlacement: cancelHierSheetPlacement,
  } = useHierSheetPlacement({
    enabled:
      toolMode === "draw_hier_sheet" &&
      isInteractionEnabled &&
      isProjectionReady,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onHierSheetAdded,
  })

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

  // Add group overlays when enabled. The key includes the active sheet so
  // overlays are recomputed against the freshly-rendered sheet's SVG.
  useSchematicGroupsOverlay({
    svgDivRef,
    circuitJson,
    circuitJsonKey: `${circuitJsonKey}_${selectedSchematicSheetId ?? ""}`,
    showGroups: showSchematicGroups && !disableGroups,
  })

  // Fade unrelated nets/chips when hovering a wire or net label (JS-driven; the
  // base SVG carries no interaction).
  useSchematicNetHover({
    svgDivRef,
    circuitJson,
    circuitJsonKey: `${circuitJsonKey}_${selectedSchematicSheetId ?? ""}`,
    enabled: netHoverHighlightEnabled,
  })

  // keep the latest touch handler without re-rendering the svg div
  const handleComponentTouchStartRef = useRef(handleComponentTouchStart)
  useEffect(() => {
    handleComponentTouchStartRef.current = handleComponentTouchStart
  }, [handleComponentTouchStart])

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
        className={
          onSchematicComponentClicked
            ? "schematic-component-clickable"
            : undefined
        }
        onTouchStart={(e) => {
          if (effectiveEditMode && isInteractionEnabled && !showSpiceOverlay) {
            handleComponentTouchStartRef.current(e)
          }
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    ),
    [
      svgString,
      isInteractionEnabled,
      clickToInteractEnabled,
      editModeEnabled,
      showSpiceOverlay,
    ],
  )

  return (
    <MouseTracker>
      {netHoverHighlightEnabled && (
        <style>
          {`.sch-net-faded { opacity: 0.35; }
            svg :is(g.trace, g.trace-overlays, g[data-schematic-component-id], [data-schematic-net-label-id]) { transition: opacity 0.12s ease-in-out; }`}
        </style>
      )}
      {onSchematicComponentClicked && (
        <style>
          {`.schematic-component-clickable [data-schematic-component-id]:hover { cursor: pointer !important; }`}
        </style>
      )}
      {onSchematicPortClicked && (
        <style>
          {`[data-schematic-port-id]:hover { cursor: pointer !important; }`}
        </style>
      )}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          backgroundColor: containerBackgroundColor,
          overflow: hierSheetState.pendingBox ? "visible" : "hidden",
          cursor: showSpiceOverlay
            ? "auto"
            : toolMode === "draw_wire" ||
                toolMode === "draw_trace" ||
                toolMode === "draw_bus" ||
                toolMode === "draw_bus_entry" ||
                toolMode === "draw_no_connect" ||
                toolMode === "draw_net_label" ||
                toolMode === "draw_global_label" ||
                toolMode === "draw_hier_sheet" ||
                toolMode === "draw_power_port" ||
                toolMode === "draw_ground_port" ||
                toolMode === "draw_text_note" ||
                toolMode === "draw_component"
              ? "crosshair"
              : isDragging
                ? "grabbing"
                : clickToInteractEnabled && !isInteractionEnabled
                  ? "pointer"
                  : isHoveringClickableComponent && onSchematicComponentClicked
                    ? "pointer"
                    : isHoveringClickablePort && onSchematicPortClicked
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
          if (allowComponentEdit) {
            handleMouseDown(e)
          }
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
        <ViewMenu
          circuitJson={circuitJson}
          circuitJsonKey={circuitJsonKey}
          open={showViewMenu}
          onOpenChange={setShowViewMenu}
          showGroups={showSchematicGroups}
          onToggleGroups={(value) => {
            if (!disableGroups) {
              setShowSchematicGroups(value)
              setStoredBoolean("schematic_viewer_show_groups", value)
            }
          }}
          showGrid={showGrid}
          onToggleGrid={setShowGridInternal}
        />
        <SchematicSheetSelector
          sheets={schematicSheets}
          selectedSheetId={selectedSchematicSheetId}
          onSelectSheet={handleSelectSheet}
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
            onSimOptionsChange={(options) => {
              setHasSpiceSimRun(true)
              setSpiceSimOptions(options)
            }}
            hasRun={hasSpiceSimRun}
          />
        )}
        {onSchematicComponentClicked &&
          schematicComponentIds.map((componentId) => (
            <SchematicComponentMouseTarget
              key={componentId}
              componentId={componentId}
              svgDivRef={svgDivRef}
              containerRef={containerRef}
              showOutline={true}
              circuitJsonKey={circuitJsonKey}
              onHoverChange={handleComponentHoverChange}
              onComponentClick={(id, event) => {
                onSchematicComponentClicked?.({
                  schematicComponentId: id,
                  event,
                })
              }}
            />
          ))}
        {svgDiv}
        <WirePreview
          state={activeWirePreviewState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
        />
        <ComponentPlacementPreview
          state={componentPlacementState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
          componentKind={placementComponentKind}
        />
        <BusPreview
          state={busDrawingState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
        />
        <BusEntryPreview
          state={busEntryPreviewState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
        />
        <NoConnectPreview
          state={noConnectPreviewState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
        />
        <NetLabelPreview
          state={netLabelState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
          onConfirm={confirmPlacement}
          onCancel={cancelPlacement}
        />
        <GlobalLabelPreview
          state={globalLabelState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
          onConfirm={confirmGlobalPlacement}
          onCancel={cancelGlobalPlacement}
        />
        <PowerPortPreview
          state={powerPortState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
          onConfirm={confirmPowerPlacement}
          onCancel={cancelPowerPlacement}
        />
        <GroundPortPreview
          state={groundPortState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
          onConfirm={confirmGroundPlacement}
          onCancel={cancelGroundPlacement}
        />
        <TextNotePreview
          state={textNoteState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
          onConfirm={confirmTextNotePlacement}
          onCancel={cancelTextNotePlacement}
        />
        <HierSheetPreview
          state={hierSheetState}
          realToSvgProjection={realToSvgProjection}
          svgToScreenProjection={svgToScreenProjection}
          containerRef={containerRef}
          sheetTargets={hierSheetTargets}
          activeSheetId={activeSheetId}
          onConfirm={confirmHierSheetPlacement}
          onCancel={cancelHierSheetPlacement}
        />
        {showSchematicPorts &&
          schematicPortsInfo.map(({ portId, label }) => (
            <SchematicPortMouseTarget
              key={portId}
              portId={portId}
              portLabel={label}
              svgDivRef={svgDivRef}
              containerRef={containerRef}
              showOutline={true}
              interactive={toolMode === "draw_wire" || toolMode === "draw_trace"}
              hitPaddingPx={toolMode === "draw_trace" ? 12 : 4}
              onPortMouseDown={portMouseDownHandler}
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
