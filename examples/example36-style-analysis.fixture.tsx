import { SchematicViewer } from "../lib/components/SchematicViewer"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance="1k" schX={0} />
    <resistor name="R2" resistance="2k" schX={0.2} />
    <capacitor name="C1" capacitance="1uF" schX={3} />
  </board>,
)

export default () => (
  <div>
    <p>
      Right-click the schematic and choose Run Style Analysis to inspect the
      overlapping resistors.
    </p>
    <SchematicViewer
      circuitJson={circuitJson}
      containerStyle={{ height: "80vh" }}
    />
  </div>
)
