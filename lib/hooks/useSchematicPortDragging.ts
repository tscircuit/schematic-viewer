import { su } from "@tscircuit/soup-util"
import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import {
  type BlockedScreenRegionsProvider,
  clampCenterAgainstBlockedRegions,
} from "../utils/blockedRegions"
import type {
  EditSchematicPortLocationEvent,
  EditSchematicPortLocationEventWithElement,
  ExtendedManualEditEvent,
} from "../types/edit-events"

interface Args {
  circuitJson: any[]
  editEvents: ExtendedManualEditEvent[]
  svgToScreenProjection: Matrix
  realToSvgProjection: Matrix
  onEditEvent?: (event: EditSchematicPortLocationEvent) => void
  cancelDrag?: () => void
  enabled?: boolean
  snapToGrid?: boolean
  getBlockedScreenRegions?: BlockedScreenRegionsProvider
}

interface Result {
  handleMouseDown: (portId: string, e: MouseEvent) => void
  isDragging: boolean
  activeEditEvent: EditSchematicPortLocationEventWithElement | null
}

// Latest known port centers keyed by port id (accumulates completed drags).
function latestPortCenter(
  events: ExtendedManualEditEvent[],
  portId: string,
): { x: number; y: number } | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i]
    if (
      "edit_event_type" in ev &&
      ev.edit_event_type === "edit_schematic_port_location" &&
      !ev.in_progress &&
      ev.schematic_port_id === portId
    ) {
      return { ...ev.new_center }
    }
  }
  return null
}

export const useSchematicPortDragging = ({
  circuitJson,
  editEvents,
  svgToScreenProjection,
  realToSvgProjection,
  onEditEvent,
  cancelDrag,
  enabled = false,
  snapToGrid = false,
  getBlockedScreenRegions,
}: Args): Result => {
  const [activeEditEvent, setActiveEditEvent] =
    useState<EditSchematicPortLocationEventWithElement | null>(null)
  const activeRef = useRef<EditSchematicPortLocationEventWithElement | null>(
    null,
  )
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
  // Bbox at drag start — see useComponentDragging for why we must not re-read
  // getBoundingClientRect mid-drag.
  const originalBBoxRef = useRef<DOMRect | null>(null)

  const realToScreenProjection = compose(
    realToSvgProjection,
    svgToScreenProjection,
  )

  const startDrag = useCallback(
    (
      portId: string,
      clientX: number,
      clientY: number,
      target: EventTarget | null,
    ) => {
      if (!enabled) return false
      const port = su(circuitJson).schematic_port.get(portId) as
        | {
            schematic_port_id: string
            schematic_component_id: string
            center: { x: number; y: number }
          }
        | undefined
      if (!port) return false

      if (cancelDrag) cancelDrag()

      const startCenter = latestPortCenter(editEvents, portId) ?? {
        ...port.center,
      }
      dragStartPosRef.current = { x: clientX, y: clientY }
      const el = (target as Element | null)?.closest?.(
        `[data-schematic-port-id="${portId}"]`,
      ) as Element | null
      originalBBoxRef.current =
        el?.getBoundingClientRect() ??
        (target as Element | null)?.getBoundingClientRect?.() ??
        null

      const newEvent: EditSchematicPortLocationEventWithElement = {
        edit_event_id: Math.random().toString(36).slice(2, 11),
        edit_event_type: "edit_schematic_port_location",
        schematic_port_id: port.schematic_port_id,
        schematic_component_id: port.schematic_component_id,
        original_center: startCenter,
        new_center: { ...startCenter },
        in_progress: true,
        created_at: Date.now(),
        _element: (target as SVGElement) ?? (null as unknown as SVGElement),
      }
      activeRef.current = newEvent
      setActiveEditEvent(newEvent)
      return true
    },
    [cancelDrag, circuitJson, editEvents, enabled],
  )

  const handleMouseDown = useCallback(
    (portId: string, e: MouseEvent) => {
      startDrag(portId, e.clientX, e.clientY, e.target)
    },
    [startDrag],
  )

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!activeRef.current || !dragStartPosRef.current) return
      const screenDelta = {
        x: clientX - dragStartPosRef.current.x,
        y: clientY - dragStartPosRef.current.y,
      }
      const mmDelta = {
        x: screenDelta.x / realToScreenProjection.a,
        y: screenDelta.y / realToScreenProjection.d,
      }
      let newCenter = {
        x: activeRef.current.original_center.x + mmDelta.x,
        y: activeRef.current.original_center.y + mmDelta.y,
      }
      if (snapToGrid) {
        const snap = (v: number) => Math.round(v * 10) / 10
        newCenter = { x: snap(newCenter.x), y: snap(newCenter.y) }
      }
      const blockedRegions = getBlockedScreenRegions?.() ?? []
      if (blockedRegions.length > 0 && originalBBoxRef.current) {
        newCenter = clampCenterAgainstBlockedRegions({
          currentBBox: originalBBoxRef.current,
          originalCenter: activeRef.current.original_center,
          proposedCenter: newCenter,
          realToScreenProjection,
          blockedRegions,
        })
      }
      const next = { ...activeRef.current, new_center: newCenter }
      activeRef.current = next
      setActiveEditEvent(next)
    },
    [realToScreenProjection, snapToGrid, getBlockedScreenRegions],
  )

  const endDrag = useCallback(() => {
    if (!activeRef.current) return
    const final: EditSchematicPortLocationEvent = {
      ...activeRef.current,
      in_progress: false,
    }
    delete (final as any)._element
    if (onEditEvent) onEditEvent(final)
    activeRef.current = null
    dragStartPosRef.current = null
    originalBBoxRef.current = null
    setActiveEditEvent(null)
  }, [onEditEvent])

  useEffect(() => {
    const onMove = (e: MouseEvent) => updateDrag(e.clientX, e.clientY)
    const onUp = () => endDrag()
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [updateDrag, endDrag])

  return {
    handleMouseDown,
    isDragging: !!activeRef.current,
    activeEditEvent,
  }
}
