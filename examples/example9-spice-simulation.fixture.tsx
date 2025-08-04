import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { SchematicViewer } from "lib/index"
import type { CircuitJson } from "circuit-json"

const circuit = (
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance={1000} schX={-2} />
    <capacitor name="C1" capacitance="1uF" schX={2} />
    {/* <trace from=".R1 .pin2" to=".C1 .pin1" />
    <powersource voltage="5V" name="V1" schX={0} schY={-3} />
    <trace from=".V1 .positive" to=".R1 .pin1" />
    <trace from=".V1 .negative" to=".C1 .pin2" />
    <ground name="GND" schX={0} schY={-5} />
    <trace from=".V1 .negative" to=".GND .gnd" /> */}
  </board>
)

const spiceString = `
* Circuit JSON to SPICE Netlist
    RR1 N1 N2 1K
    RR2 N2 0 2K
    CC1 N2 0 10U
    Vsimulation_voltage_source_0 N1 0 DC 5

    .tran 0.1ms 50ms UIC
    .ic V(N1)=0
    .probe V(VOUT) V(N1)

    .END

`

export default () => {
  const circuitJson = renderToCircuitJson(circuit) as CircuitJson

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <SchematicViewer
        circuitJson={circuitJson}
        containerStyle={{ height: "100%" }}
        debugGrid
        editingEnabled
        spiceSimulationEnabled
        spiceString={spiceString}
      />
    </div>
  )
}
