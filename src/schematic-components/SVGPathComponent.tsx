import { useCameraTransform } from "lib/render-context"
import getSVGPathBounds from "lib/utils/get-svg-path-bounds"

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
}

export const SVGPathComponent = ({ size, center, rotation, paths }: Props) => {
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
  const absoluteSize = {
    width: Math.max(1, size.width * ct.a),
    height: Math.max(1, size.height * ct.d),
  }

  return (
    <svg
      style={{
        position: "absolute",
        transform: rotation === 0 ? "" : `rotate(${rotation}rad)`,
        left: absoluteCenter.x - absoluteSize.width / 2,
        top: absoluteCenter.y - absoluteSize.height / 2,
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
  )
}

export default SVGPathComponent
