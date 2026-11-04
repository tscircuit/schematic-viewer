import { expect, test } from "bun:test"
import { JSDOM } from "jsdom"
import { renderToStaticMarkup } from "react-dom/server"
import { SchematicComponentDetailsTooltip } from "../lib/components/SchematicComponentDetailsTooltip"
import type { SourceComponent } from "../lib/utils/component-details"

test("long component detail labels wrap without overlapping values", () => {
  const sourceComponent: SourceComponent = {
    type: "source_component",
    source_component_id: "source_component_sw1",
    ftype: "simple_switch",
    name: "SW1",
    internally_connected_source_port_ids: [["source_port_0", "source_port_2"]],
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
    (element) => element.textContent === "internally_connected_source_port_ids",
  )

  expect(label).toBeDefined()
  expect(label?.nextElementSibling?.textContent).toContain("source_port_0")
  expect((label as HTMLElement).style.overflowWrap).toBe("anywhere")
})
