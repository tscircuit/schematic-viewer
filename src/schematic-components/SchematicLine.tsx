import * as Type from "lib/types"
import { directionToVec } from "lib/utils/direction-to-vec"
import * as Component from "."
import Path from "svg-path-generator"
import getSVGPathBounds from "lib/utils/get-svg-path-bounds"

interface Props {
  line: {
    schematic: Type.SchematicLine
  }
}

export const SchematicLine = ({ line: { schematic } }: Props) => {
  const { x1, x2, y1, y2 } = schematic
  const dx = x2 - x1
  const dy = y2 - y1
  // const width = Math.abs(dx) + 0.1
  // const height = Math.abs(dy) + 0.1
  // const center = { x: x1 + dx / 2, y: y1 + dy / 2 }
  const path = Path()
  path.moveTo(x1, y1)
  path.lineTo(x2, y2)
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
          stroke: "red",
          strokeWidth: 0.02,
          d: d,
        },
      ]}
    />
  )
}

export default SchematicLine
