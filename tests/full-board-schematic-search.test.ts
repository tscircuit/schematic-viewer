import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import circuitJson from "../examples/rp2040-motor-controller.circuit.json"
import { getSchematicSearchResults } from "../lib/utils/get-schematic-search-results"

test("searches components and nets in a full board", () => {
  const fullBoardCircuitJson = circuitJson as CircuitJson

  const componentResults = getSchematicSearchResults(fullBoardCircuitJson, "U1")
  const netResults = getSchematicSearchResults(fullBoardCircuitJson, "MOTOR_A1")

  expect(componentResults[0]?.label).toBe("U1")
  expect(componentResults[0]?.kind).toBe("component")
  expect(netResults.some((result) => result.label === "MOTOR_A1")).toBe(true)
})
