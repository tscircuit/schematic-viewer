import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { SchematicViewer } from "lib/index"
import type { CircuitJson } from "circuit-json"
import { sel } from "tscircuit"

const circuit = (
  <board width={16} height={16}>
    <chip
      name="V1"
      footprint="sot23"
      pinLabels={{
        pin1: "VOUT",
        pin2: "GND",
      }}
      pinAttributes={{
        VOUT: { providesPower: true, providesVoltage: 5 },
        GND: { providesGround: true },
      }}
    />

    <resistor name="R1" resistance="1k" footprint="0402" pcbX={4} pcbY={4} />
    <resistor name="R2" resistance="2k" footprint="0402" pcbX={-4} pcbY={-4} />
    <capacitor
      name="C1"
      capacitance="10uF"
      footprint="0402"
      pcbX={0}
      pcbY={-2}
    />

    <trace from={"net.VOUT"} to={sel.R1.pin1} />
    <trace from={".V1 > .VOUT"} to={"net.VOUT"} />
    <trace from={sel.R1.pin2} to={sel.R2.pin1} />
    <trace from={sel.R2.pin2} to={"net.GND"} />
    <trace from={"net.GND"} to={".V1 > .GND"} />

    <trace from={sel.C1.pin1} to={sel.R1.pin2} />
    <trace from={sel.C1.pin2} to={"net.GND"} />
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
