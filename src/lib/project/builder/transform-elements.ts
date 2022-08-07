import * as Type from "lib/types"
import { Matrix, applyToPoint } from "transformation-matrix"

export const transformSchematicElement = (
  elm: Type.AnyElement,
  matrix: Matrix
) => {
  if (elm.type === "schematic_component") {
    // elm.center
    // elm.rotation
    // elm.size
  } else if (elm.type === "schematic_port") {
    elm.center = applyToPoint(matrix, elm.center)
  } else if (elm.type === "schematic_text") {
    elm.position = applyToPoint(matrix, elm.position)
  } else if (elm.type === "schematic_group") {
  } else if (elm.type === "schematic_trace") {
  }
  return elm
}

export const transformSchematicElements = (
  elms: Type.AnyElement[],
  matrix: Matrix
) => {
  return elms.map((elm) => transformSchematicElement(elm, matrix))
}
