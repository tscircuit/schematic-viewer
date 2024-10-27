import { useGlobalStore } from "lib/render-context"
import getSVGPathBounds from "lib/utils/get-svg-path-bounds"
import { useState } from "react"
import {
  applyToPoint,
  compose,
  scale,
  toSVG,
  translate,
} from "transformation-matrix"
import "../pages/style.css"
interface PathProps {
  type?: "path"
  strokeWidth: number
  stroke: string
  fill?: string
  d: string
}

interface CircleProps {
  type: "circle"
  cx: number
  cy: number
  r: number
  strokeWidth: number
  stroke: string
  fill?: string
}

interface TextProps {
  type: "text"
  cx: number
  cy: number
  text: string
  fontSize?: number
  fill: string
  anchor?: "start" | "middle" | "end"
  rotation?: number
  stroke?: string
}

export type SVGElement = PathProps | CircleProps | TextProps

interface Props {
  rotation: number
  center: { x: number; y: number }
  size: { width: number; height: number }
  invertY?: boolean
  shiftToBottom?: boolean
  paths: SVGElement[]
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
  const pathBounds = getSVGPathBounds(
    paths
      .filter((p): p is PathProps => p.type !== "circle" && p.type !== "text")
      .map((p) => p.d),
  )
  const padding = { x: 0, y: 0 }
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
  const preferredRatio =
    pathBounds.width === 0
      ? innerSize.height / pathBounds.height
      : innerSize.width / pathBounds.width
  const svgToScreen = compose(
    scale(
      pathBounds.width === 0
        ? preferredRatio
        : fullSize.width / pathBounds.width,
      pathBounds.height === 0
        ? preferredRatio
        : fullSize.height / pathBounds.height,
    ),
    translate(-pathBounds.minX, -pathBounds.minY),
  )

  const baseFontSize = 0.15 // Fixed base font size in schematic units

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg
      onMouseOver={() => setHovering(Boolean(hoverContent))}
      onFocus={() => setHovering(Boolean(hoverContent))}
      onMouseOut={() => setHovering(false)}
      onBlur={() => setHovering(false)}
      style={{
        position: "absolute",
        cursor: hovering ? "pointer" : undefined,
        zIndex,
        transform: [
          invertY ? "scale(1, 1)" : "scale(1, -1)",
          shiftToBottom ? "translate(0, 100%)" : "",
          rotation === 0 ? "" : `rotate(${rotation}deg)`,
        ].join(" "),
        left: svgLeft,
        top: svgTop,
      }}
      overflow="visible"
      width={fullSize.width}
      height={fullSize.height}
    >
      {paths.map((p, i) => {
        if (p.type === "circle") {
          return (
            <circle
              key={`${p.type}-${i}`}
              transform={toSVG(compose(scale(1, 1), svgToScreen))}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={"none"}
              strokeWidth={2.25 * (p.strokeWidth || 1)}
              stroke={p.stroke || "red"}
            />
          )
        }
        if (p.type === "text") {
          const transformedPos = applyToPoint(svgToScreen, { x: p.cx, y: p.cy })
          const scaleFactor = fullSize.width / pathBounds.width || 1

          return (
            <g key={`${p.type}-${i}`}>
              <text
                className="schematic-text"
                x={transformedPos.x}
                y={transformedPos.y}
                fill={p.fill}
                fontSize={baseFontSize * scaleFactor}
                textAnchor={p.anchor || "middle"}
                dominantBaseline="middle"
                transform={`scale(1,-1) rotate(${p.rotation || 0})`}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
                stroke={p.stroke}
              >
                {p.text}
              </text>
            </g>
          )
        }
        // Handle the "path" type directly
        return (
          <path
            key={`${p.type}-${i}`}
            transform={toSVG(svgToScreen)}
            fill={p.fill ?? "none"}
            strokeLinecap="round"
            strokeWidth={1.5 * (p.strokeWidth || 1)}
            stroke={p.stroke || "red"}
            d={p.d || ""}
          />
        )
      })}
    </svg>
  )
}

export default SVGPathComponent
