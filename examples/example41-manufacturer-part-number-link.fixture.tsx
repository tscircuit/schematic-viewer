import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board>
    <chip
      name="U1"
      manufacturerPartNumber="ESP32-C3-MINI-1-N4"
      supplierPartNumbers={{ jlcpcb: ["C2838502"] }}
    />
  </board>,
)

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ height: "100%" }}
  />
)
