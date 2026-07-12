import { type Matrix, applyToPoint, compose } from "transformation-matrix"
import { useRef, useEffect } from "react"
import type { PowerPortPlacementState } from "../hooks/usePowerPortPlacement"

const POWER_COLOR = "#c1271c"

interface Props {
  state: PowerPortPlacementState
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
  onConfirm: (netName: string) => void
  onCancel: () => void
}

export const PowerPortPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  onConfirm,
  onCancel,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.pendingPos && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.value = "VCC"
    }
  }, [state.pendingPos])

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
  const toScreen = (pt: { x: number; y: number }) =>
    applyToPoint(realToScreen, pt)

  const PowerShape = ({ pos }: { pos: { x: number; y: number } }) => {
    const sp = toScreen(pos)
    return (
      <g transform={`translate(${sp.x}, ${sp.y})`} opacity={0.85}>
        {/* KiCad-style power arrow pointing up; wire at bottom */}
        <line x1={0} y1={0} x2={0} y2={18} stroke={POWER_COLOR} strokeWidth={1.5} />
        <polygon points="0,-14 -8,2 8,2" fill="none" stroke={POWER_COLOR} strokeWidth={1.5} />
        <text x={-10} y={-18} fontSize={9} fill={POWER_COLOR} fontFamily="monospace">
          PWR
        </text>
        <circle cx={0} cy={0} r={3} fill={POWER_COLOR} opacity={0.6} />
      </g>
    )
  }

  return (
    <>
      {state.previewPos && !state.pendingPos && (
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
          <PowerShape pos={state.previewPos} />
        </svg>
      )}

      {state.pendingPos &&
        (() => {
          const sp = toScreen(state.pendingPos)
          return (
            <div
              style={{
                position: "absolute",
                left: sp.x + 4,
                top: sp.y - 36,
                zIndex: 60,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Net name (VCC, +3V3)…"
                style={{
                  background: "#1a1a2e",
                  border: `1.5px solid ${POWER_COLOR}`,
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  width: 140,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onConfirm((e.target as HTMLInputElement).value)
                  } else if (e.key === "Escape") {
                    onCancel()
                  }
                  e.stopPropagation()
                }}
              />
              <button
                type="button"
                style={{
                  background: POWER_COLOR,
                  border: "none",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 11,
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (inputRef.current) onConfirm(inputRef.current.value)
                }}
              >
                ✓
              </button>
            </div>
          )
        })()}
    </>
  )
}