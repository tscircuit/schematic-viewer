import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <SchematicViewer
    circuitJson={renderToCircuitJson(
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance={1000} schX={-2} />
        <capacitor name="C1" capacitance="1uF" schX={2} schY={2} />
        <capacitor
          name="C2"
          schRotation={90}
          capacitance="1uF"
          schX={0}
          schY={-4}
        />
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

        <trace from=".R1 .pin2" to=".C1 .pin1" />
        <trace from=".C1 .pin2" to=".U1 .pin4" />
        <trace from=".U1 .pin8" to=".C2 .pin1" />
        <trace from=".C2 .pin2" to=".R1 .pin1" />
        <trace from=".U1 .pin1" to=".U1 .pin5" />
      </board>,
    )}
    editingEnabled
    containerStyle={{ height: "100%" }}
    debugGrid
    debug
    colorOverrides={{
      schematic: {
        background: "transparent",
        component_body: "#FFFFFF",
      },
    }}
  />
)
