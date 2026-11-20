import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import { getSourceComponentInfoEntries } from "../lib/utils/component-details"

const crystalFrequencyUnitsCircuit = (
  <board width="20mm" height="10mm">
    <inductor name="L1" inductance="7.5nH" schX={-4} />
    <capacitor name="C1" capacitance="3pF" schX={0} />
    <crystal name="Y1" frequency="16MHz" loadCapacitance="9pF" schX={4} />
  </board>
)

test("crystal frequency lacks the unit shown for inductance and capacitance", () => {
  const circuitJson = renderToCircuitJson(crystalFrequencyUnitsCircuit)
  const sourceComponents = circuitJson.filter(
    (element) => element.type === "source_component",
  )
  expect(sourceComponents).toHaveLength(3)
  expect(
    sourceComponents.map((component) =>
      getSourceComponentInfoEntries(component),
    ),
  ).toMatchInlineSnapshot(`
    [
      [
        {
          "key": "name",
          "label": "name",
          "value": "L1",
        },
        {
          "key": "inductance",
          "label": "inductance",
          "value": ""7.5nH"",
        },
      ],
      [
        {
          "key": "name",
          "label": "name",
          "value": "C1",
        },
        {
          "key": "capacitance",
          "label": "capacitance",
          "value": ""3pF"",
        },
      ],
      [
        {
          "key": "name",
          "label": "name",
          "value": "Y1",
        },
        {
          "key": "frequency",
          "label": "frequency",
          "value": "16000000",
        },
        {
          "key": "load_capacitance",
          "label": "load_capacitance",
          "value": "9e-12",
        },
        {
          "key": "pin_variant",
          "label": "pin_variant",
          "value": ""two_pin"",
        },
      ],
    ]
  `)

  const crystal = sourceComponents.find(
    (component) => component.ftype === "simple_crystal",
  )
  if (!crystal || crystal.ftype !== "simple_crystal")
    throw new Error("Missing crystal")

  expect(crystal.frequency).toBe(16_000_000)
  expect(getSourceComponentInfoEntries(crystal)).toContainEqual({
    key: "frequency",
    label: "frequency",
    value: "16000000",
  })
  const markup = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={crystal}
      left={0}
      top={0}
      width={300}
      maxHeight={400}
    />,
  )
  expect(markup).toContain(">16000000</dd>")
  expect(markup).toContain(">9e-12</dd>")
  expect(crystal.load_capacitance).toBe(9e-12)
  expect(crystal.frequency).toBe(16_000_000)
})
