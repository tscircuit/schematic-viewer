import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <SchematicViewer
    circuitJson={renderToCircuitJson(
      <board width="16mm" height="10mm">
        <resistor name="R1" resistance="1k" schX={-5} schY={2} />
        <resistor name="R2" resistance="10k" schX={0} schY={2} />
        <capacitor name="C1" capacitance="1uF" schX={5} schY={2} />
        <resistor name="R3" resistance="4.7k" schX={-2} schY={-2} />
        <capacitor name="C2" capacitance="100nF" schX={4} schY={-2} />

        <trace from=".R1 > .pin2" to="net.SIGNAL" />
        <trace from=".R2 > .pin1" to="net.SIGNAL" />
        <trace from=".C1 > .pin1" to="net.SIGNAL" />
        <trace from=".R3 > .pin1" to="net.GND" />
        <trace from=".C2 > .pin2" to="net.GND" />
      </board>,
    )}
    containerStyle={{ height: "100%" }}
    debugGrid
  />
)
