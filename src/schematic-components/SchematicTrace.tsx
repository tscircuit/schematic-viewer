import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"
import Path from "svg-path-generator"
import getSVGPathBounds from "lib/utils/get-svg-path-bounds"
import RenderError from "./RenderError"

interface Props {
  trace: {
    source: Type.SourceTrace
    schematic: Type.SchematicTrace
  }
}

export const SchematicTrace = ({ trace: { source, schematic } }: Props) => {
  const route = schematic.route
  if (route.length === 0) {
    return <RenderError text="Route with 0 segments" />
  }
  const path = Path()
  path.moveTo(route[0].x, route[0].y)
  for (let i = 1; i < route.length; i++) {
    path.lineTo(route[i].x, route[i].y)
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
    <SVGPathComponent
      rotation={0}
      center={center}
      size={pathBounds}
      paths={[
        {
          stroke: "green",
          strokeWidth: 0.02,
          d,
        },
      ]}
    />
  )
}

export default SchematicTrace
