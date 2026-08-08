import type { SubcircuitProps } from "@tscircuit/props"
import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const SensorSheet = (props: SubcircuitProps) => (
  <subcircuit {...props}>
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
  </subcircuit>
)

const PowerSheet = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U_REG"
      footprint="sot23"
      manufacturerPartNumber="AP2112K"
      pinLabels={{ pin1: "VIN", pin2: "GND", pin3: "VOUT" }}
      connections={{
        VIN: "net.VBUS",
        GND: "net.GND",
        VOUT: "net.VCC",
      }}
    />
    <capacitor
      name="C_OUT"
      capacitance="1uF"
      footprint="0402"
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
    />
  </subcircuit>
)

const circuitJson = renderToCircuitJson(
  <board routingDisabled>
    <schematicsheet name="Sensors" displayName="Sensors" sheetIndex={0} />
    <schematicsheet name="Power" displayName="Power" sheetIndex={1} />
    <SensorSheet name="SENSORS" schSheetName="Sensors" />
    <PowerSheet name="POWER" schSheetName="Power" />
  </board>,
)

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
