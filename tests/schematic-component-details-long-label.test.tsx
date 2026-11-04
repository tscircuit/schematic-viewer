import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { renderToStaticMarkup } from "react-dom/server"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"

test("internal source component IDs are hidden from the details popup", () => {
  const circuitJson = renderToCircuitJson(
    <board>
      <pushbutton
        name="SW1"
        pinLabels={{ pin1: ["A"], pin2: ["B"], pin3: ["A2"], pin4: ["B2"] }}
        internallyConnectedPins={[
          ["pin1", "pin3"],
          ["pin2", "pin4"],
        ]}
      />
    </board>,
  )
  const sourceComponent = circuitJson.find(
    (element) => element.type === "source_component" && element.name === "SW1",
  )
  if (sourceComponent?.type !== "source_component") {
    throw new Error("Expected the generated SW1 source component")
  }
  expect(sourceComponent.internally_connected_source_port_ids).toHaveLength(2)
  const originalSourceComponent = structuredClone(sourceComponent)

  const html = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={sourceComponent}
      left={0}
      top={0}
      width={360}
      maxHeight={300}
    />,
  )
  const dom = new JSDOM(html)
  const document = dom.window.document
  const labels = Array.from(document.querySelectorAll("dt")).map(
    (element) => element.textContent,
  )

  expect(labels).toEqual(["name"])
  expect(
    Array.from(document.querySelectorAll("dd")).map(
      (element) => element.textContent,
    ),
  ).toEqual(["SW1"])
  expect(sourceComponent).toEqual(originalSourceComponent)
  dom.window.close()
})

test("long non-ID detail labels declare overflow wrapping", () => {
  const circuitJson = renderToCircuitJson(
    <board>
      <resistor
        name="R1"
        resistance="1k"
        manufacturerPartNumber="RC0603FR-071KL"
      />
    </board>,
  )
  const sourceComponent = circuitJson.find(
    (element) => element.type === "source_component" && element.name === "R1",
  )
  if (sourceComponent?.type !== "source_component") {
    throw new Error("Expected the generated R1 source component")
  }

  const html = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={sourceComponent}
      left={0}
      top={0}
      width={360}
      maxHeight={300}
    />,
  )
  const dom = new JSDOM(html)
  const document = dom.window.document
  const label = Array.from(document.querySelectorAll<HTMLElement>("dt")).find(
    (element) => element.textContent === "manufacturer_part_number",
  )

  expect(label).toBeDefined()
  expect(label?.nextElementSibling?.textContent).toBe('"RC0603FR-071KL"')
  expect(label?.style.overflowWrap).toBe("anywhere")
  dom.window.close()
})
