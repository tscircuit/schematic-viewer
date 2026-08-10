import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import {
  type BlockedScreenRegionsProvider,
  clampCenterAgainstBlockedRegions,
} from "../utils/blockedRegions"
import type {
  EditSchematicNetLabelLocationEventWithElement,
  ExtendedManualEditEvent,
} from "../types/edit-events"

type Pt = { x: number; y: number }

interface Args {
  circuitJson: CircuitJson
  editEvents: ExtendedManualEditEvent[]
  svgToScreenProjection: Matrix
  realToSvgProjection: Matrix
  onEditEvent?: (event: EditSchematicNetLabelLocationEventWithElement) => void
  cancelDrag?: () => void
  enabled?: boolean
  snapToGrid?: boolean
  getBlockedScreenRegions?: BlockedScreenRegionsProvider
}

interface Result {
  tryHandleMouseDown: (e: React.MouseEvent | MouseEvent) => boolean
  activeEditEvent: EditSchematicNetLabelLocationEventWithElement | null
}

/** Net offset a label has already accumulated from completed drags. */
function offsetFromEvents(
  editEvents: ExtendedManualEditEvent[],
  netLabelId: string,
): Pt {
  return editEvents.reduce(
    (acc, ev) => {
      if (
        !("edit_event_type" in ev) ||
        ev.edit_event_type !== "edit_schematic_net_label_location" ||
        ev.schematic_net_label_id !== netLabelId ||
        ev.in_progress
      ) {
        return acc
      }
      return {
        x: acc.x + ev.new_center.x - ev.original_center.x,
        y: acc.y + ev.new_center.y - ev.original_center.y,
      }
    },
    { x: 0, y: 0 },
  )
}

/**
 * Drags net-label / power / ground symbols in select mode. IC pins stay fixed
 * to their component (Altium), so these symbols are the movable "ports" on a
 * sheet. Wires follow because their endpoints sit on the label anchor.
 */
export const useSchematicNetLabelDragging = ({
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
  const [activeEvent, setActiveEvent] =
    useState<EditSchematicNetLabelLocationEventWithElement | null>(null)
  const activeRef = useRef<EditSchematicNetLabelLocationEventWithElement | null>(
    null,
  )
  const dragStartRef = useRef<Pt | null>(null)
  const originalBBoxRef = useRef<DOMRect | null>(null)
  const positionsRef = useRef<Map<string, Pt>>(new Map())

  const realToScreenProjection = compose(
    realToSvgProjection,
    svgToScreenProjection,
  )

  const tryHandleMouseDown = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!enabled || (e as MouseEvent).button !== 0) return false
      const target = e.target
      if (!(target instanceof Element)) return false

      const labelEl = target.closest("[data-schematic-net-label-id]")
      if (!labelEl) return false
      const netLabelId = labelEl.getAttribute("data-schematic-net-label-id")
      if (!netLabelId) return false

      const label = (
        su(circuitJson).schematic_net_label.list() as {
          schematic_net_label_id: string
          center?: Pt
          anchor_position?: Pt
        }[]
      ).find((l) => l.schematic_net_label_id === netLabelId)
      const base = label?.center ?? label?.anchor_position
      if (!base) return false

      if (cancelDrag) cancelDrag()

      const tracked = positionsRef.current.get(netLabelId)
      const offset = offsetFromEvents(editEvents, netLabelId)
      const current: Pt = tracked ?? {
        x: base.x + offset.x,
        y: base.y + offset.y,
      }
      positionsRef.current.set(netLabelId, { ...current })

      dragStartRef.current = { x: e.clientX, y: e.clientY }
      originalBBoxRef.current = labelEl.getBoundingClientRect()

      const event: EditSchematicNetLabelLocationEventWithElement = {
        edit_event_id: Math.random().toString(36).slice(2, 11),
        edit_event_type: "edit_schematic_net_label_location",
        schematic_net_label_id: netLabelId,
        original_center: { ...current },
        new_center: { ...current },
        in_progress: true,
        created_at: Date.now(),
        _element: labelEl as unknown as SVGElement,
      }
      activeRef.current = event
      setActiveEvent(event)
      e.preventDefault()
      e.stopPropagation()
      return true
    },
    [cancelDrag, circuitJson, editEvents, enabled],
  )

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!activeRef.current || !dragStartRef.current) return

      const screenDelta = {
        x: clientX - dragStartRef.current.x,
        y: clientY - dragStartRef.current.y,
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

      const event = { ...activeRef.current, new_center: newCenter }
      activeRef.current = event
      setActiveEvent(event)
    },
    [realToScreenProjection, snapToGrid, getBlockedScreenRegions],
  )

  const endDrag = useCallback(() => {
    if (!activeRef.current) return
    const final = { ...activeRef.current, in_progress: false }
    positionsRef.current.set(final.schematic_net_label_id, {
      ...final.new_center,
    })
    onEditEvent?.(final)
    activeRef.current = null
    dragStartRef.current = null
    originalBBoxRef.current = null
    setActiveEvent(null)
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

  return { tryHandleMouseDown, activeEditEvent: activeEvent }
}
