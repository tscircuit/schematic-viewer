import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board routingDisabled>
    <chip
      name="U_SENSOR"
      footprint="soic4"
      manufacturerPartNumber="SHT40"
      pinLabels={{ pin1: "VCC", pin2: "SDA", pin3: "SCL", pin4: "GND" }}
      connections={{
        VCC: "net.VCC",
        SDA: "net.I2C_SDA",
        SCL: "net.I2C_SCL",
        GND: "net.GND",
      }}
    />
    <capacitor
      name="C_SENSOR"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
    />
  </board>,
)

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
