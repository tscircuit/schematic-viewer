import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"

interface Props {
  component: {
    source: Type.SimplePowerSource
    schematic: Type.SchematicComponent
  }
}

export const SimplePowerSource = ({
  component: { source, schematic },
}: Props) => {
  return (
    <SVGPathComponent
      rotation={schematic.rotation}
      center={schematic.center}
      size={schematic.size}
      invertY
      paths={[
        {
          stroke: "red",
          strokeWidth: 1,
          d: "M 0 -17 L 0 -3 M -8 3 L 8 3 M 0 17 L 0 3 M -12 -3 L 12 -3",
        },
      ]}
    />
  )
}

export default SimplePowerSource
