import { useCameraTransform } from "lib/render-context"
import getSVGPathBounds from "lib/utils/get-svg-path-bounds"
import { useCallback, useState } from "react"

import { applyToPoint } from "transformation-matrix"

interface Props {
  rotation: number
  center: { x: number; y: number }
  size: { width: number; height: number }
  paths: Array<{
    strokeWidth: number
    stroke: string
    fill?: string
    d: string
  }>
  zIndex?: number
  hoverContent?: any
}

export const SVGPathComponent = ({
  size,
  center,
  rotation,
  paths,
  zIndex,
  hoverContent,
}: Props) => {
  const ct = useCameraTransform()
  const pathBounds = getSVGPathBounds(paths.map((p) => p.d))
  // Margin in SVG Space
  const badRatio =
    Math.abs(pathBounds.width / pathBounds.height - size.width / size.height) >
    0.01
  if (badRatio) {
    // console.warn(
    //   `Ratio doesn't match for component. ${pathBounds.width}:${pathBounds.height} is not close to ${size.width}:${size.height}`
    // )
  }
  pathBounds.height = Math.max(pathBounds.height, 1)
  pathBounds.width = Math.max(pathBounds.width, 1)
  const absoluteCenter = applyToPoint(ct, center)
  const actualAbsWidth = size.width * ct.a
  const actualAbsHeight = size.height * ct.d
  const absoluteSize = {
    width: Math.max(1, actualAbsWidth),
    height: Math.max(1, actualAbsHeight),
  }

  const [hovering, setHovering] = useState(false)

  const svgLeft = absoluteCenter.x - absoluteSize.width / 2
  const svgTop = absoluteCenter.y - absoluteSize.height / 2

  return (
    <>
      {hovering && (
        <>
          <div
            style={{
              position: "absolute",
              left: svgLeft - 4,
              top: svgTop - 4,
              pointerEvents: "none",
              width: actualAbsWidth + 8,
              height: actualAbsHeight + 8,
              border: "1px red solid",
              mixBlendMode: "difference",
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: svgLeft + actualAbsWidth + 10,
              pointerEvents: "none",
              zIndex: 1000,
              color: "red",
              mixBlendMode: "difference",
              top: svgTop,
              fontFamily: "monospace",
              fontSize: 14,
            }}
          >
            {hoverContent}
          </div>
        </>
      )}
      <svg
        onMouseOver={() => setHovering(Boolean(hoverContent))}
        onMouseOut={() => setHovering(false)}
        style={{
          position: "absolute",
          // backgroundColor: hovering ? "rgba(0, 0, 255, 0.5)" : "transparent",
          cursor: hovering ? "pointer" : undefined,
          zIndex,
          transform: rotation === 0 ? "" : `rotate(${rotation}rad)`,
          left: svgLeft,
          top: svgTop,
          // backgroundColor: badRatio ? "rgba(255, 0, 0, 0.5)" : "transparent",
        }}
        overflow="visible"
        width={absoluteSize.width}
        height={absoluteSize.height}
        viewBox={`${pathBounds.minX} ${pathBounds.minY} ${pathBounds.width} ${pathBounds.height}`}
      >
        {paths.map((p, i) => (
          <path
            key={i}
            fill={p.fill ?? "none"}
            strokeLinecap="round"
            strokeWidth={2 * (p.strokeWidth || 1)}
            stroke={p.stroke || "red"}
            d={p.d}
          />
        ))}
      </svg>
    </>
  )
}

export default SVGPathComponent
