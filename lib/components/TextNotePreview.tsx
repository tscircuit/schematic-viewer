import { type Matrix, applyToPoint, compose } from "transformation-matrix"
import { useRef, useEffect } from "react"
import type { TextNotePlacementState } from "../hooks/useTextNotePlacement"

const NOTE_COLOR = "#1a1612"

interface Props {
  state: TextNotePlacementState
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
  onConfirm: (text: string) => void
  onCancel: () => void
}

export const TextNotePreview = ({
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
  ) {
    return null
  }

  const realToScreen = compose(svgToScreenProjection, realToSvgProjection)
  const toScreen = (pt: { x: number; y: number }) =>
    applyToPoint(realToScreen, pt)

  const NoteShape = ({ pos }: { pos: { x: number; y: number } }) => {
    const sp = toScreen(pos)
    return (
      <g transform={`translate(${sp.x}, ${sp.y})`} opacity={0.75}>
        <text
          x={0}
          y={0}
          fontSize={11}
          fill={NOTE_COLOR}
          fontFamily="monospace"
          fontStyle="italic"
        >
          Text
        </text>
        <circle cx={0} cy={0} r={3} fill={NOTE_COLOR} opacity={0.4} />
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
          <NoteShape pos={state.previewPos} />
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
                placeholder="Note text…"
                style={{
                  background: "#1a1a2e",
                  border: `1.5px solid ${NOTE_COLOR}`,
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  width: 180,
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
                  background: NOTE_COLOR,
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