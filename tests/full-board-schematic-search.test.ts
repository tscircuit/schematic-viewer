import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { JSDOM } from "jsdom"
import circuitJson from "../examples/wifi-smart-switch.circuit.json"
import am3352CircuitJson from "../examples/am3352-dev-board-4layer-dogbone.circuit.json"
import { getSchematicSearchResults } from "../lib/utils/get-schematic-search-results"

test("searches components and nets in a Wi-Fi smart switch board", () => {
  const fullBoardCircuitJson = circuitJson as CircuitJson

  const componentResults = getSchematicSearchResults(fullBoardCircuitJson, "U2")
  const netResults = getSchematicSearchResults(
    fullBoardCircuitJson,
    "RELAY_CTL",
  )

  expect(componentResults[0]?.label).toBe("U2 ESP-12F (ESP8266MOD)")
  expect(componentResults[0]?.detail).toBe("U2 · ESP-12F(ESP8266MOD)")
  expect(componentResults[0]?.kind).toBe("component")
  expect(netResults.some((result) => result.label === "RELAY_CTL")).toBe(true)
})

test("finds each inline label on its schematic sheet", () => {
  const results = getSchematicSearchResults(
    am3352CircuitJson as CircuitJson,
    "usb0_dm",
  )

  expect(results.map((result) => result.target)).toEqual([
    { type: "schematic_text", id: "schematic_text_120" },
    { type: "schematic_text", id: "schematic_text_121" },
  ])
  expect(results.map((result) => result.schematicSheetId)).toEqual([
    "schematic_sheet_2",
    "schematic_sheet_2",
  ])
})

test("does not search free-standing sheet annotations", () => {
  expect(
    getSchematicSearchResults(
      am3352CircuitJson as CircuitJson,
      "Matching net labels",
    ),
  ).toEqual([])
})

test("renders selectable svg targets for inline search results", () => {
  const results = getSchematicSearchResults(
    am3352CircuitJson as CircuitJson,
    "usb0_dm",
  )
  const svg = convertCircuitJsonToSchematicSvg(
    am3352CircuitJson as CircuitJson,
    { schematicSheetId: "schematic_sheet_2" },
  )
  const { document } = new JSDOM(svg).window

  expect(
    results.map(
      (result) =>
        document.querySelector(`[data-schematic-text-id="${result.target.id}"]`)
          ?.textContent,
    ),
  ).toEqual(["USB0_DM", "USB0_DM"])
})
