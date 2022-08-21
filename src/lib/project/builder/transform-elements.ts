import * as Type from "lib/types"
import {
  directionToVec,
  rotateDirection,
  vecToDirection,
} from "lib/utils/direction-to-vec"
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

    if (elm.facing_direction) {
      elm.facing_direction = rotateDirection(
        elm.facing_direction,
        (Math.acos(matrix.a) / Math.PI) * 2
      )
    }
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
