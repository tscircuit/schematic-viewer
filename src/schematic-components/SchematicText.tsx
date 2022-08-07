import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"
import Path from "svg-path-generator"
import getSVGPathBounds from "lib/utils/get-svg-path-bounds"
import { useCameraTransform } from "lib/render-context"
import { applyToPoint } from "transformation-matrix"

interface Props {
  schematic_text: Type.SchematicText
}

export const SchematicText = ({ schematic_text }: Props) => {
  const ct = useCameraTransform()
  const { text, center } = schematic_text
  const tCenter = applyToPoint(ct, center)
  console.log(tCenter.x, tCenter.y)
  return (
    <div
      style={{
        position: "absolute",
        left: tCenter.x,
        top: tCenter.y,
      }}
    >
      {text}
    </div>
  )
}

export default SchematicText
