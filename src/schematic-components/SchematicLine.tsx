import * as Type from "lib/types"
import { directionToVec } from "lib/utils/direction-to-vec"
import * as Component from "."

interface Props {
  line: {
    schematic: Type.SchematicLine
  }
}

export const SchematicLine = ({ line: { schematic } }: Props) => {
  const { x1, x2, y1, y2 } = schematic
  const dx = x2 - x1
  const dy = y2 - y1
  const width = Math.abs(dx) + 0.1
  const height = Math.abs(dy) + 0.1
  const center = { x: x1 + dx / 2, y: y1 + dy / 2 }

  return (
    <Component.SVGPathComponent
      rotation={0}
      center={center}
      size={{ width, height }}
      paths={[
        {
          stroke: "red",
          strokeWidth: 10,
          d: `M 0 0 l ${dx * 100} ${dy * 100}`,
        },
      ]}
    />
  )
}

export default SchematicLine
