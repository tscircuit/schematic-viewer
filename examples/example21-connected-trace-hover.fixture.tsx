import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="12mm" height="10mm" routingDisabled>
    <resistor name="R1" resistance="1k" schX={-3} schY={1.5} />
    <resistor name="R2" resistance="2k" schX={3} schY={1.5} />
    <capacitor name="C1" capacitance="1uF" schX={0} schY={-2} />

    <trace from=".R1 .pin2" to="net.SIGNAL" />
    <trace from=".R2 .pin1" to="net.SIGNAL" />
    <trace from=".C1 .pin1" to="net.SIGNAL" />
  </board>,
)

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ height: "100%" }}
    debugGrid
  />
)
