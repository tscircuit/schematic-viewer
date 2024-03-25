import * as Type from "lib/types"
import { directionToVec } from "lib/utils/direction-to-vec"
import * as Component from "."
import Path from "svg-path-generator"
import getSVGPathBounds from "lib/utils/get-svg-path-bounds"

interface Props {
  path: {
    schematic: Type.SchematicPath
  }
}

export const SchematicPath = (props: Props) => {
  console.log("SchematicPath", props)
  const { points, is_filled, is_closed, fill_color } = props.path.schematic

  if (points.length === 0) return null
  const path = Path()
  path.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) {
    path.lineTo(point.x, point.y)
  }
  if (is_closed) {
    path.closePath()
  }
  const d = path.toString()
  const pathBounds = getSVGPathBounds(d)
  pathBounds.height = Math.max(pathBounds.height, 1)
  pathBounds.width = Math.max(pathBounds.width, 1)
  const center = {
    x: pathBounds.minX + pathBounds.width / 2,
    y: pathBounds.minY + pathBounds.height / 2,
  }

  return (
    <Component.SVGPathComponent
      rotation={0}
      center={center}
      size={pathBounds}
      paths={[
        {
          stroke: is_filled ? "none" : fill_color ?? "red",
          strokeWidth: 0.02,
          fill: is_filled ? fill_color ?? "red" : undefined,
          d: d,
        },
      ]}
    />
  )
}

export default SchematicPath
