import * as Type from "lib/types"
import { directionToVec } from "lib/utils/direction-to-vec"
import * as Component from "./"

interface Props {
  box: {
    schematic: Type.SchematicBox
  }
}

export const SchematicBox = ({ box: { schematic } }: Props) => {
  const { width: w, height: h } = schematic
  return (
    <Component.SVGPathComponent
      rotation={0}
      center={schematic}
      size={{ width: schematic.width, height: schematic.height }}
      paths={[
        {
          stroke: "blue",
          strokeWidth: 0.2,
          d: `M 0 0 l ${w} 0 l 0 ${h} l -${w} 0 z`,
        },
        schematic.facing_direction
          ? {
              stroke: "blue",
              strokeWidth: 0.5,
              d: `M 5 5 l ${directionToVec(schematic.facing_direction).x * 7} ${
                directionToVec(schematic.facing_direction).y * 7
              }`,
            }
          : null,
      ].filter(Boolean)}
    />
  )
}

export default SchematicBox
