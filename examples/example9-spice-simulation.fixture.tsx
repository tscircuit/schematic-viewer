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

const spiceString = `* 5V DC battery connected through two resistors in series

V1 in 0 DC 5         ; 5V DC battery
R1 in out 1k         ; 1k ohm resistor from 'in' to 'out'
R2 out 0 1k          ; 1k ohm resistor from 'out' to ground

.control
tran 1ms 10ms        ; Transient analysis: 10 ms duration, 1 ms step
wrdata data.out v(in) v(out) i(V1)
.endc

.end
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
