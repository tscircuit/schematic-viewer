import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <SchematicViewer
    circuitJson={renderToCircuitJson(
      <board width="10mm" height="10mm">
        <chip
          name="U1"
          pinLabels={{
            pin1: "D0",
            pin2: "D1",
            pin3: "D2",
            pin4: "GND",
            pin5: "D3",
            pin6: "EN",
            pin7: "D4",
            pin8: "VCC",
          }}
          footprint="soic8"
          schX={0}
          schY={-1.5}
        />
      </board>,
    )}
    editingEnabled
    containerStyle={{ height: "100%" }}
    debugGrid
    debug
    css=".custom-theme .sch-component-body {
          fill: #c7d2fe !important;
          stroke: #4338ca !important;
        }"
    className="custom-theme"
    colorOverrides={{
      schematic: {
        background: "transparent",
        component_body: "#FFFFFF",
      },
    }}
  />
)
