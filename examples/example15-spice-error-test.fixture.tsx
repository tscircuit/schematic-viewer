import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <SchematicViewer
    circuitJson={renderToCircuitJson(
      <board width="10mm" height="10mm">
        {/* This circuit should trigger a SPICE error due to missing output specification */}
        <resistor name="R1" resistance={1000} schX={-2} />
        <capacitor name="C1" capacitance="1uF" schX={2} />
        {/* No trace or source - this should cause validation errors */}
      </board>,
    )}
    containerStyle={{ height: "100%" }}
    spiceSimulationEnabled={true}
  />
)
