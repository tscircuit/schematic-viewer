import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import circuitJson from "../examples/wifi-smart-switch.circuit.json"
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
