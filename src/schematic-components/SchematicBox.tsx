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
          stroke: "red",
          strokeWidth: 0.02,
          d: `M 0 0 l ${w} 0 l 0 ${h} l -${w} 0 z`,
        },
      ]}
    />
  )
}

export default SchematicBox
