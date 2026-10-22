import { expect, test } from "bun:test"
import React from "react"
import { SchematicViewer } from "../lib/components/SchematicViewer"
import type { CircuitJson } from "circuit-json"

test("SchematicViewer includes sch-net-highlighted CSS rules when hover highlight is enabled", () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_component",
      source_component_id: "c1",
      name: "R1",
      ftype: "simple_resistor",
    },
    {
      type: "schematic_component",
      schematic_component_id: "sc1",
      source_component_id: "c1",
      center: { x: 0, y: 0 },
      rotation: 0,
      size: { width: 1, height: 0.5 },
    },
  ]

  // Render to static markup to inspect the rendered CSS style tag
  const { renderToStaticMarkup } = require("react-dom/server")
  const html = renderToStaticMarkup(
    <SchematicViewer
      circuitJson={circuitJson}
      netHoverHighlightEnabled={true}
    />,
  )

  expect(html).toContain(".sch-net-highlighted")
  expect(html).toContain(".sch-net-faded")
  expect(html).toContain("stroke: #ff00d4")
})
