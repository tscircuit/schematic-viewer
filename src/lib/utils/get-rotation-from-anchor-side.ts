import type { SchematicNetLabel } from "@tscircuit/soup"

type AnchorSide = SchematicNetLabel["anchor_side"]

export const getRotationFromAnchorSide = (anchor_side: AnchorSide) => {
  if (anchor_side === "left") return 0
  if (anchor_side === "top") return (Math.PI * 3) / 2
  if (anchor_side === "right") return Math.PI
  if (anchor_side === "bottom") return Math.PI / 2
  return 0
}
