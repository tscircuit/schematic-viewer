import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="16mm" height="12mm" routingDisabled>
    <resistor name="R1" resistance={1000} schX={-5} schY={2} />
    <resistor name="R2" resistance={1000} schX={-1} schY={2} />
    <capacitor name="C1" capacitance="1uF" schX={3} schY={2} />
    <capacitor name="C2" capacitance="100nF" schX={5} schY={-2} />
    <chip
      name="U1"
      pinLabels={{
        pin1: "VCC",
        pin2: "SIG_A",
        pin3: "SIG_B",
        pin4: "GND",
        pin5: "AUX_A",
        pin6: "AUX_B",
        pin7: "AUX_C",
        pin8: "AUX_D",
      }}
      footprint="soic8"
      schX={0}
      schY={-2}
    />

    <trace from="net.GND" to=".R1 .pin1" />
    <trace from="net.GND" to=".C1 .pin2" />
    <trace from="net.GND" to=".C2 .pin2" />
    <trace from=".U1 .pin4" to="net.GND" />

    <trace from=".R1 .pin2" to=".R2 .pin1" />
    <trace from=".R2 .pin2" to=".U1 .pin2" />
    <trace from=".U1 .pin1" to=".C1 .pin1" />
    <trace from=".U1 .pin3" to=".C2 .pin1" />
  </board>,
)

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ height: "100%" }}
  />
)
