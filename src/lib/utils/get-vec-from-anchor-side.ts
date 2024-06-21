import type { SchematicNetLabel } from "@tscircuit/soup"

type AnchorSide = SchematicNetLabel["anchor_side"]

export const getVecFromAnchorSide = (anchor_side: AnchorSide) => {
  if (anchor_side === "left") return { x: -1, y: 0 }
  if (anchor_side === "top") return { x: 0, y: -1 }
  if (anchor_side === "right") return { x: 1, y: 0 }
  if (anchor_side === "bottom") return { x: 0, y: 1 }
  throw new Error(`invalid anchor side "${anchor_side}"`)
}
