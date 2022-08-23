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
          // https://commons.wikimedia.org/wiki/File:Electrical_symbols_library.svg
          d: "m 371,710.41665 h -14 c -0.0421,-16.39898 -14.02104,-16.39898 -14,0 -0.021,-16.399 -14.04182,-16.34072 -14,0 -2.6e-4,-16.45722 -14.04236,-16.45722 -14,0 2.8e-4,-16.3407 -13.97896,-16.39898 -14,0 -0.0421,-16.39898 -13.91338,-16.39898 -13.91338,0 H 273",
        },
      ]}
    />
  )
}

export default SimpleInductor
