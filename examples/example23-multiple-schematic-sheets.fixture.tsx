import type { SubcircuitProps } from "@tscircuit/props"
import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

/**
 * A generic LED driver block placed on its own schematic sheet.
 */
const LedDriver = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U1"
      footprint="soic4"
      pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "IN", pin4: "OUT" }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["VCC", "IN", "GND"] },
        rightSide: { direction: "top-to-bottom", pins: ["OUT"] },
      }}
      connections={{ VCC: "net.VCC", GND: "net.GND" }}
    />
    <capacitor
      name="C_DEC"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "U1.VCC", pin2: "net.GND" }}
    />
    <resistor
      name="R_LED"
      resistance="330"
      footprint="0402"
      connections={{ pin1: "U1.OUT", pin2: "D1.anode" }}
    />
    <led name="D1" footprint="0603" connections={{ cathode: "net.GND" }} />
  </subcircuit>
)

/**
 * A generic buffered RC filter block placed on its own schematic sheet.
 */
const RcFilter = (props: SubcircuitProps) => (
  <subcircuit {...props}>
    <chip
      name="U1"
      footprint="soic4"
      pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "IN", pin4: "OUT" }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["IN", "VCC", "GND"] },
        rightSide: { direction: "top-to-bottom", pins: ["OUT"] },
      }}
      connections={{ VCC: "net.VCC", GND: "net.GND" }}
    />
    <resistor
      name="R_F"
      resistance="1k"
      footprint="0402"
      connections={{ pin1: "net.SIG_IN", pin2: "U1.IN" }}
    />
    <capacitor
      name="C_F"
      capacitance="10nF"
      footprint="0402"
      connections={{ pin1: "U1.IN", pin2: "net.GND" }}
    />
    <capacitor
      name="C_OUT"
      capacitance="1uF"
      footprint="0402"
      connections={{ pin1: "U1.OUT", pin2: "net.GND" }}
    />
  </subcircuit>
)

const circuitJson = renderToCircuitJson(
  <board routingDisabled>
    <schematicsheet name="LED Driver" displayName="LED Driver" sheetIndex={0} />
    <schematicsheet name="RC Filter" displayName="RC Filter" sheetIndex={1} />

    <LedDriver name="DRV" schSheetName="LED Driver" />
    <RcFilter name="FLT" schSheetName="RC Filter" />
  </board>,
)

export default () => {
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <SchematicViewer
        circuitJson={circuitJson}
        containerStyle={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#f8f9fa",
        }}
        editingEnabled
      />
    </div>
  )
}
