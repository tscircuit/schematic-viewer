import { SchematicText as SchematicTextType } from "circuit-json"
import { useGlobalStore } from "lib/render-context"
import useMeasure from "react-use-measure"
import { applyToPoint } from "transformation-matrix"

interface Props {
  schematic_text: SchematicTextType
}

export const SchematicText = ({ schematic_text }: Props) => {
  const ct = useGlobalStore((s) => s.camera_transform)
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

  const fontTransformRatio = 0.15 // magic number (roughly 0.1mm = 12px)
  const projectedTextSize = fontTransformRatio * ct.a

  return (
    <div
      ref={boundsRef}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        position: "absolute",
        fontSize: projectedTextSize,
        left: tPos.x + offset[0],
        top: tPos.y + offset[1],
        color: schematic_text.color,
      }}
    >
      {text}
    </div>
  )
}

export default SchematicText
