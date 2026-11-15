import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { renderToStaticMarkup } from "react-dom/server"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board>
    <resistor name="R1" resistance="5.1k" />
  </board>,
)
const resistor = circuitJson.find(
  (element) =>
    element.type === "source_component" && element.ftype === "simple_resistor",
)
if (!resistor) throw new Error("Expected resistor R1")

test("resistor details preserve the ohm symbol", () => {
  const html = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={resistor}
      left={0}
      top={0}
      width={400}
      maxHeight={400}
    />,
  )
  const { document } = new JSDOM(html).window
  const resistanceLabel = Array.from(document.querySelectorAll("dt")).find(
    (label) => label.textContent === "resistance",
  )
  expect(resistanceLabel?.nextElementSibling?.textContent).toBe('"5.1kΩ"')
})
