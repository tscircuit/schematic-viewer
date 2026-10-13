import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import {
  type SourceComponent,
  getSourceComponentInfoEntries,
} from "../lib/utils/component-details"

const sourceComponent = {
  type: "source_component",
  source_component_id: "source_component_private",
  source_group_id: "source_group_private",
  name: "U1",
  ftype: "simple_chip",
  manufacturer_part_number: "TPD4S480RUKR",
  internally_connected_source_port_ids: [
    ["source_port_29", "source_port_37"],
    ["source_port_30", "source_port_36"],
  ],
  future_internal_id: "private_id",
  metadata: { source_port_id: "nested_private_id" },
  supplier_part_numbers: { jlcpcb: ["C3131250"] },
} as unknown as SourceComponent

test("component details expose only readable product properties", () => {
  expect(getSourceComponentInfoEntries(sourceComponent)).toEqual([
    { key: "name", label: "Reference", value: "U1" },
    {
      key: "manufacturer_part_number",
      label: "Part number",
      value: "TPD4S480RUKR",
    },
  ])
})

test("component values preserve display units and omit structured values", () => {
  const entries = getSourceComponentInfoEntries({
    ...sourceComponent,
    resistance: 1000,
    display_resistance: "1kΩ",
    capacitance: null,
    voltage: { source_port_id: "private" },
    current: " ",
    frequency: 0,
  } as unknown as SourceComponent)
  expect(entries).toContainEqual({
    key: "resistance",
    label: "Resistance",
    value: "1kΩ",
  })
  expect(entries).toContainEqual({
    key: "frequency",
    label: "Frequency",
    value: "0",
  })
  expect(
    entries.some(({ key }) =>
      ["capacitance", "voltage", "current"].includes(key),
    ),
  ).toBe(false)
})

test("tooltip hides internal IDs while preserving supplier part numbers", () => {
  const html = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={sourceComponent}
      footprinterString="qfn-20"
      left={0}
      top={0}
      width={320}
      maxHeight={400}
    />,
  )
  expect(html).toContain("Part number")
  expect(html).toContain("TPD4S480RUKR")
  expect(html).toContain("JLCPCB")
  expect(html).toContain("C3131250")
  expect(html).toContain("qfn-20")
  for (const internal of [
    "source_component_private",
    "source_port_29",
    "source_port_37",
    "private_id",
    "internally_connected",
    "manufacturer_part_number",
  ]) {
    expect(html).not.toContain(internal)
  }
  expect(html).not.toContain("&quot;TPD4S480RUKR&quot;")
  expect(html).not.toContain("&quot;qfn-20&quot;")
})
