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
  const ct = useGlobalStore((s) => s.camera_transform)
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

  // Three sizes:
  // pathBound size (the size of the path in "d")
  // innerSize (the screen-space size of the path)
  // fullSize (the screen-space size of the svg element, innerSize plus padding)

  const padding = {
    x: 0,
    y: 0,
  }

  const absoluteCenter = applyToPoint(ct, center)

  const innerSize = {
    width: size.width * ct.a,
    height: size.height * Math.abs(ct.d),
  }

  const fullSize = {
    width: innerSize.width + padding.x * 2,
    height: innerSize.height + padding.y * 2,
  }

  const [hovering, setHovering] = useState(false)

  const svgLeft = absoluteCenter.x - fullSize.width / 2
  const svgTop = absoluteCenter.y - fullSize.height / 2

  // const viewBox = `${pathBounds.minX} ${pathBounds.minY} ${pathBounds.width} ${pathBounds.height}`
  // const viewBox2 = `${svgLeft} ${svgTctualAbsWidth} ${actualAbsHeight}`

  // console.log(
  //   pathBounds,
  //   fullSize,
  //   fullSize.width / pathBounds.width,
  //   fullSize.height / pathBounds.height
  // )
  const preferredRatio =
    pathBounds.width === 0
      ? innerSize.height / pathBounds.height
      : innerSize.width / pathBounds.width
  const svgToScreen = compose(
    // translate(0, 0)
    scale(
      pathBounds.width === 0
        ? preferredRatio
        : fullSize.width / pathBounds.width,
      pathBounds.height === 0
        ? preferredRatio
        : fullSize.height / pathBounds.height
    ),
    translate(-pathBounds.minX, -pathBounds.minY)
    // translate(center.x, center.y)
  )
  // console.log(svgToScreen)
  // console.log(toSVG(svgToScreen))
  // console.log(paths[0].d)
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
              width: fullSize.width + 12,
              height: fullSize.height + 12,
              border: "1px red solid",
              mixBlendMode: "difference",
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: svgLeft + fullSize.width + 10,
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
        width={fullSize.width}
        height={fullSize.height}
      >
        {paths.map((p, i) => (
          <path
            key={i}
            transform={toSVG(svgToScreen)}
            fill={p.fill ?? "none"}
            strokeLinecap="round"
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
