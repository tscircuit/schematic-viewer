import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { renderToStaticMarkup } from "react-dom/server"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import type { SourceComponent } from "../lib/utils/component-details"

test("internal source component IDs are hidden from the details popup", () => {
  const sourceComponent: SourceComponent = {
    type: "source_component",
    source_component_id: "source_component_sw1",
    ftype: "simple_switch",
    name: "SW1",
    internally_connected_source_port_ids: [["source_port_0", "source_port_2"]],
    manufacturer_part_number: "TL3342",
    related_component_id: "source_component_other",
  } as SourceComponent

  const html = renderToStaticMarkup(
    <SchematicComponentDetailsTooltip
      sourceComponent={sourceComponent}
      left={0}
      top={0}
      width={360}
      maxHeight={300}
    />,
  )
  const document = new JSDOM(html).window.document
  const labels = Array.from(document.querySelectorAll("dt")).map(
    (element) => element.textContent,
  )

  expect(labels).toContain("name")
  expect(labels).toContain("manufacturer_part_number")
  expect(labels).not.toContain("internally_connected_source_port_ids")
  expect(labels).not.toContain("related_component_id")
  expect(document.querySelector("dialog")?.textContent).not.toContain(
    "source_port_0",
  )
})

test("long non-ID detail labels can wrap within their column", () => {
  const sourceComponent: SourceComponent = {
    type: "source_component",
    source_component_id: "source_component_sw1",
    ftype: "simple_switch",
    name: "SW1",
    manufacturer_part_number: "TL3342",
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
  const document = new JSDOM(html).window.document
  const label = Array.from(document.querySelectorAll("dt")).find(
    (element) => element.textContent === "manufacturer_part_number",
  )

  expect(label).toBeDefined()
  expect(label?.nextElementSibling?.textContent).toContain("TL3342")
  expect((label as HTMLElement).style.overflowWrap).toBe("anywhere")
})
