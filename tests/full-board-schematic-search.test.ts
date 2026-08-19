import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import circuitJson from "../examples/light-controller.circuit.json"
import { getSchematicSearchResults } from "../lib/utils/get-schematic-search-results"

test("searches components and nets in a full board", () => {
  const fullBoardCircuitJson = circuitJson as CircuitJson

  const componentResults = getSchematicSearchResults(
    fullBoardCircuitJson,
    "R_RED_GATE",
  )
  const netResults = getSchematicSearchResults(fullBoardCircuitJson, "GND")

  expect(componentResults[0]?.label).toBe("R_RED_GATE")
  expect(componentResults[0]?.kind).toBe("component")
  expect(netResults.some((result) => result.label === "GND")).toBe(true)
})
