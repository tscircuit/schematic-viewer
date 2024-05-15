import { useGlobalStore } from "lib/render-context"
import getSVGPathBounds from "lib/utils/get-svg-path-bounds"
import { useCallback, useState } from "react"

import {
  applyToPoint,
  toSVG,
  inverse,
  compose,
  translate,
  scale,
} from "transformation-matrix"

interface Props {
  rotation: number
  center: { x: number; y: number }
  size: { width: number; height: number }
  invertY?: boolean
  shiftToBottom?: boolean
  paths: Array<{
    strokeWidth: number
    stroke: string
    fill?: string
    d: string
  }>
  zIndex?: number
  hoverContent?: any
}

export const SVGPathComponent2 = ({
  size,
  center,
  rotation,
  paths,
  zIndex,
  invertY,
  shiftToBottom,
  hoverContent,
}: Props) => {
  const ct = useGlobalStore((c) => c.camera_transform)
  const pathBounds = getSVGPathBounds(paths.map((p) => p.d))
  // Margin in SVG Space

  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        // backgroundColor: hovering ? "rgba(0, 0, 255, 0.5)" : "transparent",
        pointerEvents: "none",
        zIndex,
        // overflow: "hidden",
        // backgroundColor: badRatio ? "rgba(255, 0, 0, 0.1)" : "transparent",
        // backgroundColor: "rgba(255, 0, 0, 0.1)",
      }}
      overflow="visible"
    >
      {paths.map((p, i) => (
        <path
          key={i}
          transform={toSVG(ct)}
          fill={p.fill ?? "none"}
          strokeLinecap="round"
          strokeWidth={1.5 * (p.strokeWidth || 1)}
          stroke={p.stroke || "red"}
          d={p.d}
        />
      ))}
    </svg>
  )
}

export default SVGPathComponent2
