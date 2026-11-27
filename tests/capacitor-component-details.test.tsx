import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { renderToStaticMarkup } from "react-dom/server"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"

test("capacitor popup displays capacitance and voltage rating", () => {
  const circuitJson = renderToCircuitJson(
    <board>
      <capacitor
        name="C21"
        capacitance="4.7uF"
        maxVoltageRating="50V"
        schShowRatings
      />
    </board>,
  )
  const capacitor = circuitJson.find(
    (element) =>
      element.type === "source_component" &&
      element.ftype === "simple_capacitor",
  )
  if (!capacitor) throw new Error("Expected capacitor C21")
  const originalCircuitJson = structuredClone(circuitJson)
  const html = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={capacitor}
      left={0}
      top={0}
      width={400}
      maxHeight={400}
    />,
  )
  const { document } = new JSDOM(html).window
  expect(
    Array.from(document.querySelectorAll("dt"), (row) => row.textContent),
  ).toEqual(["name", "capacitance", "max_voltage_rating"])
  expect(
    Array.from(document.querySelectorAll("dd"), (row) => row.textContent),
  ).toEqual(["C21", '"4.7uF/50V"', "50"])
  expect(circuitJson).toEqual(originalCircuitJson)
})
