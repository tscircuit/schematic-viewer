import * as Type from "lib/types"
import { directionToVec } from "lib/utils/direction-to-vec"
import * as Component from "./"

interface Props {
  port: {
    source: Type.SourcePort
    schematic: Type.SchematicPort
  }
}

export const SchematicPort = ({ port: { source, schematic } }: Props) => {
  return (
    <Component.SVGPathComponent
      rotation={0}
      center={schematic.center}
      size={{ width: 0.2, height: 0.2 }}
      paths={[
        {
          stroke: "blue",
          strokeWidth: 1,
          d: "M 0 0 l 10 0 l 0 10 l -10 0 z",
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

export default SchematicPort
