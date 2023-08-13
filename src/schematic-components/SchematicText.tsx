import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"
import Path from "svg-path-generator"
import getSVGPathBounds from "lib/utils/get-svg-path-bounds"
import { useCameraTransform } from "lib/render-context"
import { applyToPoint } from "transformation-matrix"
import useMeasure from "react-use-measure"

interface Props {
  schematic_text: Type.SchematicText
}

export const SchematicText = ({ schematic_text }: Props) => {
  const ct = useCameraTransform()
  const { text, position, anchor } = schematic_text
  const tPos = applyToPoint(ct, position)
  const [boundsRef, bounds] = useMeasure()
  let offset = [0, 0]
  if (anchor === "center") {
    offset = [-bounds.width / 2, -bounds.height / 2]
  } else if (anchor === "left") {
    offset = [0, -bounds.height / 2]
  } else if (anchor === "right") {
    offset = [-bounds.width, -bounds.height / 2]
  }

  return (
    <div
      ref={boundsRef}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        position: "absolute",
        left: tPos.x + offset[0],
        top: tPos.y + offset[1],
      }}
    >
      {text}
    </div>
  )
}

export default SchematicText
