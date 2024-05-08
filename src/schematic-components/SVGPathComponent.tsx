import { useCameraTransform } from "lib/render-context"
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

export const SVGPathComponent = ({
  size,
  center,
  rotation,
  paths,
  zIndex,
  invertY,
  shiftToBottom,
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
  // pathBounds.height = Math.max(pathBounds.height, 0.01)
  // pathBounds.width = Math.max(pathBounds.width, 0.01)
  const absoluteCenter = applyToPoint(ct, center)
  const actualAbsWidth = size.width * ct.a
  const actualAbsHeight = size.height * Math.abs(ct.d)
  const absoluteSize = {
    width: Math.max(1, actualAbsWidth),
    height: Math.max(1, actualAbsHeight),
  }

  const [hovering, setHovering] = useState(false)

  const svgLeft = absoluteCenter.x - absoluteSize.width / 2
  const svgTop = absoluteCenter.y - absoluteSize.height / 2

  const viewBox = `${pathBounds.minX} ${pathBounds.minY} ${pathBounds.width} ${pathBounds.height}`
  // const viewBox2 = `${svgLeft} ${svgTctualAbsWidth} ${actualAbsHeight}`

  const svgToScreen = compose(
    // translate(0, 0)
    scale(
      actualAbsWidth / pathBounds.width,
      actualAbsHeight / pathBounds.height
    ),
    translate(-pathBounds.minX, -pathBounds.minY)
    // translate(center.x, center.y)
  )
  // translate(..., ...),

  return (
    <>
      {hovering && (
        <>
          <div
            style={{
              position: "absolute",
              left: svgLeft - 6,
              top: svgTop - 6,
              pointerEvents: "none",
              width: actualAbsWidth + 12,
              height: actualAbsHeight + 12,
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
          transform: [
            invertY ? "scale(1, 1)" : "scale(1, -1)", // TODO based on ct.d
            shiftToBottom ? "translate(0, 100%)" : "",
            rotation === 0 ? "" : `rotate(${rotation}rad)`,
          ].join(" "),
          left: svgLeft,
          top: svgTop,
          // overflow: "hidden",
          // backgroundColor: badRatio ? "rgba(255, 0, 0, 0.1)" : "transparent",
          // backgroundColor: "rgba(255, 0, 0, 0.1)",
        }}
        overflow="visible"
        width={absoluteSize.width}
        height={absoluteSize.height}
      >
        {paths.map((p, i) => (
          <path
            key={i}
            // transform={toSVG(inverse(ct))}
            // transform={`scale(${ct.a}, ${ct.a})`}
            transform={toSVG(svgToScreen)}
            fill={p.fill ?? "none"}
            strokeLinecap="round"
            // strokeWidth={2 * (p.strokeWidth || 1)}
            strokeWidth={1.5 * (p.strokeWidth || 1)}
            stroke={p.stroke || "red"}
            d={p.d}
          />
        ))}
      </svg>
    </>
  )
}

export default SVGPathComponent
