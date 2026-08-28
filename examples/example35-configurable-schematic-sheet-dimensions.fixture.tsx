import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export const circuitJson = renderToCircuitJson(
  <board routingDisabled>
    <schematicsheet
      name="Wide Sheet"
      displayName="Wide Sheet — 420 × 180 mm"
      sheetIndex={0}
      sheetWidth="420mm"
      sheetHeight="180mm"
    >
      <resistor name="R_LEFT" resistance="1k" footprint="0402" schX={-15} />
      <capacitor
        name="C_RIGHT"
        capacitance="100nF"
        footprint="0402"
        schX={15}
      />
      <trace from=".R_LEFT > .pin2" to=".C_RIGHT > .pin1" />
    </schematicsheet>

    <schematicsheet
      name="Tall Sheet"
      displayName="Tall Sheet — 180 × 300 mm"
      sheetIndex={1}
      sheetWidth="180mm"
      sheetHeight="300mm"
    >
      <resistor
        name="R_TOP"
        resistance="10k"
        footprint="0402"
        schY={9}
        schRotation={90}
      />
      <capacitor
        name="C_BOTTOM"
        capacitance="1uF"
        footprint="0402"
        schY={-9}
        schRotation={90}
      />
      <trace from=".R_TOP > .pin2" to=".C_BOTTOM > .pin1" />
    </schematicsheet>
  </board>,
)

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
    debugGrid
  />
)
