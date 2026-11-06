import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { JSDOM } from "jsdom"
import sheet25 from "../examples/tmds62levm-sheet-25.circuit.json"

test("fits TMDS62LEVM sheet 25 while retaining the off-page DQS note", () => {
  const circuitJson = sheet25 as CircuitJson
  const sheet = circuitJson.find(
    (element) => element.type === "schematic_sheet",
  )
  if (!sheet) throw new Error("Expected the TMDS62LEVM sheet frame")

  const options = { width: 1024, height: 768 }
  const renderedSheet = new JSDOM(
    convertCircuitJsonToSchematicSvg(circuitJson, options),
  )
  const renderedFrame = new JSDOM(
    convertCircuitJsonToSchematicSvg([sheet], options),
  )
  try {
    const transformAttribute = "data-real-to-screen-transform"
    const schematicSvg = renderedSheet.window.document.querySelector("svg")
    const frameSvg = renderedFrame.window.document.querySelector("svg")
    const frameTransform = frameSvg?.getAttribute(transformAttribute)
    expect(frameTransform).toBeTruthy()
    expect(schematicSvg?.getAttribute(transformAttribute)).toBe(frameTransform)
    expect(schematicSvg?.textContent).toContain("to SOC's DQS")
  } finally {
    renderedSheet.window.close()
    renderedFrame.window.close()
  }
})
