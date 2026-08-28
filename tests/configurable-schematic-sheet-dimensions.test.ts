import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { circuitJson } from "../examples/example35-configurable-schematic-sheet-dimensions.fixture"

const getRenderedSheetAspectRatio = (schematicSheetId: string) => {
  const svg = convertCircuitJsonToSchematicSvg(circuitJson, {
    width: 1200,
    height: 800,
    schematicSheetId,
  })
  const outerSheetRect = svg.match(
    /<rect[^>]*width="([^"]+)"[^>]*height="([^"]+)"[^>]*data-schematic-rect-id="[^"]+_outer"/,
  )

  expect(outerSheetRect).not.toBeNull()
  return Number(outerSheetRect![1]) / Number(outerSheetRect![2])
}

test("renders each schematic sheet using its configured dimensions", () => {
  const sheets = circuitJson.filter(
    (element) => element.type === "schematic_sheet",
  )

  expect(sheets).toHaveLength(2)
  expect(sheets[0]).toMatchObject({
    name: "Wide Sheet",
    sheet_width: 420,
    sheet_height: 180,
  })
  expect(sheets[1]).toMatchObject({
    name: "Tall Sheet",
    sheet_width: 180,
    sheet_height: 300,
  })

  expect(
    getRenderedSheetAspectRatio(sheets[0]!.schematic_sheet_id),
  ).toBeCloseTo(420 / 180)
  expect(
    getRenderedSheetAspectRatio(sheets[1]!.schematic_sheet_id),
  ).toBeCloseTo(180 / 300)
})
