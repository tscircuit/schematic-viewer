import { expect, test } from "bun:test"
import { zIndexMap } from "../lib/utils/z-index-map"

test("all zIndexMap values are unique", () => {
  const values = Object.values(zIndexMap)
  expect(new Set(values).size).toBe(values.length)
})

test("the schematic port hover label doesn't collide with any other layer", () => {
  // SchematicPortMouseTarget renders its hover label at
  // schematicPortHoverOutline + 1, so that derived value needs to stay clear
  // of every other layer too, not just the base value.
  const portHoverLabelZIndex = zIndexMap.schematicPortHoverOutline + 1
  const otherValues = Object.entries(zIndexMap)
    .filter(([key]) => key !== "schematicPortHoverOutline")
    .map(([, value]) => value)

  expect(otherValues).not.toContain(portHoverLabelZIndex)
})
