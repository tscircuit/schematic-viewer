import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <div style={{ width: "100vw", height: "90vh" }}>
    <SchematicViewer
      circuitJson={renderToCircuitJson(
        <board width="10mm" height="10mm">
          <resistor name="R1" resistance={1000} schX={-2} />
          <capacitor name="C1" capacitance="1uF" schX={2} />
          <trace from=".R1 .pin2" to=".C1 .pin1" />
        </board>,
      )}
    />
  </div>
)
