import { type Matrix, applyToPoint, compose } from "transformation-matrix"
import { useRef, useEffect } from "react"
import type { NetLabelPlacementState } from "../hooks/useNetLabelPlacement"

interface Props {
  state: NetLabelPlacementState
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
  onConfirm: (netName: string) => void
  onCancel: () => void
}

export const NetLabelPreview = ({
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
      inputRef.current.value = ""
    }
  }, [state.pendingPos])

  const container = containerRef.current
  if (!container) return null

  if (
    !realToSvgProjection?.a ||
    isNaN(realToSvgProjection.a) ||
    !svgToScreenProjection?.a ||
    isNaN(svgToScreenProjection.a)
  )
    return null

  const realToScreen = compose(svgToScreenProjection, realToSvgProjection)
  const toScreen = (pt: { x: number; y: number }) =>
    applyToPoint(realToScreen, pt)

  const LabelShape = ({ pos }: { pos: { x: number; y: number } }) => {
    const sp = toScreen(pos)
    return (
      <g transform={`translate(${sp.x}, ${sp.y})`} opacity={0.8}>
        <polygon
          points="0,-10 60,-10 70,0 60,10 0,10"
          fill="none"
          stroke="#00b4d8"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
        <text x={5} y={4} fontSize={10} fill="#00b4d8" fontFamily="monospace">
          NET
        </text>
        <circle cx={0} cy={0} r={3} fill="#00b4d8" opacity={0.6} />
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
          <LabelShape pos={state.previewPos} />
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
                top: sp.y - 10,
                zIndex: 60,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Net name…"
                style={{
                  background: "#1a1a2e",
                  border: "1.5px solid #00b4d8",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  width: 120,
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
                  background: "#00b4d8",
                  border: "none",
                  color: "#000",
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
