import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { renderToStaticMarkup } from "react-dom/server"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"
import {
  type SourceComponent,
  getSourceComponentInfoEntries,
} from "../lib/utils/component-details"

const circuitJson = renderToCircuitJson(
  <board width="20mm" height="10mm">
    <crystal name="Y1" frequency="16MHz" loadCapacitance="9pF" schX={-4} />
    <crystal
      name="Y2"
      frequency="32.768kHz"
      loadCapacitance="12.5pF"
      schX={4}
    />
  </board>,
)

const getCrystalByName = (name: string): SourceComponent => {
  const crystal = circuitJson.find(
    (element): element is SourceComponent =>
      element.type === "source_component" &&
      element.ftype === "simple_crystal" &&
      element.name === name,
  )
  if (!crystal) {
    throw new Error(`Expected crystal ${name}`)
  }
  return crystal
}

test("crystal details format frequency and load capacitance with SI units", () => {
  const crystal16MHz = getCrystalByName("Y1")
  const crystal32kHz = getCrystalByName("Y2")

  expect(getSourceComponentInfoEntries(crystal16MHz)).toContainEqual({
    key: "frequency",
    label: "frequency",
    value: '"16MHz"',
  })
  expect(getSourceComponentInfoEntries(crystal16MHz)).toContainEqual({
    key: "load_capacitance",
    label: "load_capacitance",
    value: '"9pF"',
  })

  expect(getSourceComponentInfoEntries(crystal32kHz)).toContainEqual({
    key: "frequency",
    label: "frequency",
    value: '"32.768kHz"',
  })
  expect(getSourceComponentInfoEntries(crystal32kHz)).toContainEqual({
    key: "load_capacitance",
    label: "load_capacitance",
    value: '"12.5pF"',
  })

  const html = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={crystal16MHz}
      left={0}
      top={0}
      width={400}
      maxHeight={400}
    />,
  )
  const { document } = new JSDOM(html).window

  expect(
    Array.from(document.querySelectorAll("dt"), (row) => row.textContent),
  ).toEqual(["name", "frequency", "load_capacitance", "pin_variant"])
  expect(
    Array.from(document.querySelectorAll("dd"), (row) => row.textContent),
  ).toEqual(["Y1", '"16MHz"', '"9pF"', '"two_pin"'])
})
