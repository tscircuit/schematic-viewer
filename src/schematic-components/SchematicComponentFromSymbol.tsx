import * as Type from "lib/types"
import { colorMap } from "lib/utils/colors"
import { symbols } from "schematic-symbols"
import SVGPathComponent from "./SVGPathComponent"

interface Props {
  component: {
    source: Type.SimpleResistor
    schematic: Type.SchematicComponent
  }
}

export const SchematicComponentFromSymbol = ({ component: { source, schematic } }: Props) => {
  const { center, rotation } = schematic
  // Get the resistor symbol paths
  const symbol = symbols[schematic.symbol_name]
  const paths = symbol.primitives
    .filter((p: any) => p.type === "path")
    .map((p: any) => ({
      stroke: colorMap.schematic.component_outline,
      strokeWidth: 0.02,
      d: p.points.reduce(
        (acc: string, point: { x: number; y: number }, index: number) => {
          const command = index === 0 ? "M" : "L"
          return `${acc} ${command} ${point.x} ${point.y}`
        },
        "",
      ),
    }))

  return (
    <SVGPathComponent
      rotation={rotation}
      center={center}
      size={{
        width: symbol?.size.width,
        height: symbol?.size.height,
      }}
      paths={paths}
    />
  )
}

export default SchematicComponentFromSymbol
