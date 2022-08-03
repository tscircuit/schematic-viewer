import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"

interface Props {
  component: {
    source: Type.SimpleInductor
    schematic: Type.SchematicComponent
  }
}

export const SimpleInductor = ({ component: { source, schematic } }: Props) => {
  return (
    <SVGPathComponent
      rotation={schematic.rotation}
      center={schematic.center}
      size={schematic.size}
      paths={[
        {
          stroke: "red",
          strokeWidth: 1,
          d: "M 0 15 l 10 0 l 0 -6 l 20 0 l 0 12 l -20 0 l 0 -6 m 20 0 l 10 0",
        },
      ]}
    />
  )
}

export default SimpleInductor
