import { type Matrix, applyToPoint, compose } from "transformation-matrix"
import { useEffect, useMemo, useRef, useState } from "react"
import type {
  HierSheetPlacementState,
  ScreenBox,
} from "../hooks/useHierSheetPlacement"
import { normalizeScreenBox } from "../hooks/useHierSheetPlacement"

const SHEET_STROKE = "#0050d8"
const SHEET_FILL = "rgba(234, 242, 255, 0.35)"
const NAME_COLOR = "#006464"
const FILE_COLOR = "#725600"

export interface HierSheetTarget {
  id: string
  title: string
}

interface Props {
  state: HierSheetPlacementState
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
  sheetTargets: HierSheetTarget[]
  activeSheetId?: string
  onConfirm: (sheetName: string, targetSheetId: string) => void
  onCancel: () => void
}

const SheetSymbolShape = ({
  screenBox,
  dashed = true,
}: {
  screenBox: ScreenBox
  dashed?: boolean
}) => {
  const { x, y, width, height } = screenBox
  const pinLen = Math.min(10, width * 0.08)
  const midY = y + height / 2
  return (
    <g opacity={dashed ? 0.85 : 1}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={SHEET_FILL}
        stroke={SHEET_STROKE}
        strokeWidth={1.8}
        strokeDasharray={dashed ? "6 3" : undefined}
      />
      <line
        x1={x - pinLen}
        y1={midY - height * 0.2}
        x2={x}
        y2={midY - height * 0.2}
        stroke={SHEET_STROKE}
        strokeWidth={1.4}
      />
      <line
        x1={x - pinLen}
        y1={midY + height * 0.2}
        x2={x}
        y2={midY + height * 0.2}
        stroke={SHEET_STROKE}
        strokeWidth={1.4}
      />
      <line
        x1={x + width}
        y1={midY}
        x2={x + width + pinLen}
        y2={midY}
        stroke={SHEET_STROKE}
        strokeWidth={1.4}
      />
      <text
        x={x + 6}
        y={y + 14}
        fontSize={11}
        fill={NAME_COLOR}
        fontFamily="monospace"
        fontWeight={600}
      >
        Sheet name
      </text>
      <text
        x={x + 6}
        y={y + height - 8}
        fontSize={10}
        fill={FILE_COLOR}
        fontFamily="monospace"
      >
        Target sheet
      </text>
    </g>
  )
}

function pendingBoxKey(box: {
  x: number
  y: number
  width: number
  height: number
}): string {
  return `${box.x},${box.y},${box.width},${box.height}`
}

export const HierSheetPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  sheetTargets,
  activeSheetId,
  onConfirm,
  onCancel,
}: Props) => {
  const [sheetName, setSheetName] = useState("")
  const [targetSheetId, setTargetSheetId] = useState("")
  const initializedKeyRef = useRef<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const targets = useMemo(
    () => sheetTargets.filter((t) => t.id !== activeSheetId),
    [sheetTargets, activeSheetId],
  )

  useEffect(() => {
    if (!state.pendingBox) {
      initializedKeyRef.current = null
      setSheetName("")
      setTargetSheetId("")
      return
    }

    const key = pendingBoxKey(state.pendingBox)
    if (initializedKeyRef.current === key) return

    initializedKeyRef.current = key
    setSheetName("")
    setTargetSheetId(targets[0]?.id ?? "")
    requestAnimationFrame(() => nameInputRef.current?.focus())
  }, [state.pendingBox, targets])

  const container = containerRef.current
  if (!container) return null

  if (
    !realToSvgProjection?.a ||
    isNaN(realToSvgProjection.a) ||
    !svgToScreenProjection?.a ||
    isNaN(svgToScreenProjection.a)
  ) {
    return null
  }

  const realToScreen = compose(svgToScreenProjection, realToSvgProjection)
  const boxToScreen = (box: {
    x: number
    y: number
    width: number
    height: number
  }): ScreenBox => {
    const p1 = applyToPoint(realToScreen, { x: box.x, y: box.y })
    const p2 = applyToPoint(realToScreen, {
      x: box.x + box.width,
      y: box.y + box.height,
    })
    return {
      x: Math.min(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
      width: Math.abs(p2.x - p1.x),
      height: Math.abs(p2.y - p1.y),
    }
  }

  const previewScreenBox =
    state.isDrawing && state.anchorLocal && state.previewLocal
      ? normalizeScreenBox(state.anchorLocal, state.previewLocal)
      : null

  const committedScreenBox =
    state.pendingScreenBox ??
    (state.pendingBox ? boxToScreen(state.pendingBox) : null)

  const dialogAnchor = committedScreenBox

  const submit = () => {
    if (!sheetName.trim() || !targetSheetId.trim()) return
    onConfirm(sheetName, targetSheetId)
  }

  return (
    <>
      {previewScreenBox && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <SheetSymbolShape screenBox={previewScreenBox} />
        </svg>
      )}

      {state.pendingBox && committedScreenBox && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 51,
          }}
        >
          <SheetSymbolShape screenBox={committedScreenBox} dashed={false} />
        </svg>
      )}

      {state.pendingBox && dialogAnchor && (
        <div
          style={{
            position: "absolute",
            left: dialogAnchor.x + 8,
            top: dialogAnchor.y + dialogAnchor.height + 8,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "8px 10px",
            background: "#1a1a2e",
            border: `1.5px solid ${SHEET_STROKE}`,
            borderRadius: 6,
            minWidth: 220,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          data-schematic-ignore-mouse-capture
        >
          <label
            style={{ fontSize: 10, color: NAME_COLOR, fontFamily: "monospace" }}
          >
            Sheet name
            <input
              ref={nameInputRef}
              type="text"
              value={sheetName}
              placeholder="e.g. MCU_Sub"
              onChange={(e) => setSheetName(e.target.value)}
              style={{
                display: "block",
                marginTop: 3,
                width: "100%",
                background: "#0f0f1a",
                border: `1px solid ${NAME_COLOR}`,
                color: "#fff",
                padding: "4px 8px",
                borderRadius: 4,
                fontFamily: "monospace",
                fontSize: 12,
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submit()
                } else if (e.key === "Escape") {
                  onCancel()
                }
                e.stopPropagation()
              }}
            />
          </label>

          <label
            style={{ fontSize: 10, color: FILE_COLOR, fontFamily: "monospace" }}
          >
            Target sheet (file name)
            <select
              value={targetSheetId}
              disabled={targets.length === 0}
              onChange={(e) => setTargetSheetId(e.target.value)}
              style={{
                display: "block",
                marginTop: 3,
                width: "100%",
                background: "#0f0f1a",
                border: `1px solid ${FILE_COLOR}`,
                color: "#fff",
                padding: "4px 8px",
                borderRadius: 4,
                fontFamily: "monospace",
                fontSize: 12,
                outline: "none",
              }}
            >
              {targets.length === 0 ? (
                <option value="">No other sheets</option>
              ) : (
                targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.id})
                  </option>
                ))
              )}
            </select>
          </label>

          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              type="button"
              style={{
                background: "transparent",
                border: "1px solid #666",
                color: "#ccc",
                padding: "3px 10px",
                borderRadius: 4,
                fontSize: 11,
                cursor: "pointer",
              }}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={targets.length === 0 || !sheetName.trim()}
              style={{
                background: SHEET_STROKE,
                border: "none",
                color: "#fff",
                padding: "3px 10px",
                borderRadius: 4,
                fontFamily: "monospace",
                fontSize: 11,
                cursor:
                  targets.length === 0 || !sheetName.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity: targets.length === 0 || !sheetName.trim() ? 0.5 : 1,
              }}
              onClick={submit}
            >
              Place sheet
            </button>
          </div>
        </div>
      )}
    </>
  )
}
