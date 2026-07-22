import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="56mm" height="30mm" routingDisabled>
    <resistor name="R1" resistance="1k" schX={-21} schY={8} />
    <capacitor name="C1" capacitance="100nF" schX={-14} schY={8} />
    <inductor name="L1" inductance="10uH" schX={-7} schY={8} />
    <diode name="D1" schX={0} schY={8} />
    <led name="LED1" schX={7} schY={8} />
    <switch name="SW1" schX={14} schY={8} />

    <resistor name="R2" resistance="10k" schX={-21} schY={0} schRotation={90} />
    <capacitor
      name="C2"
      capacitance="1uF"
      schX={-14}
      schY={0}
      schRotation={90}
    />
    <inductor name="L2" inductance="47uH" schX={-7} schY={0} schRotation={90} />
    <diode name="D2" schX={0} schY={0} schRotation={90} />
    <led name="LED2" schX={7} schY={0} schRotation={90} />
    <switch name="SW2" schX={14} schY={0} schRotation={90} />

    <chip
      name="U1"
      footprint="sot23"
      schX={-16}
      schY={-8}
      pinLabels={{
        "1": "A",
        "2": "B",
        "3": "C",
      }}
    />
    <chip
      name="U2"
      footprint="soic8"
      schX={0}
      schY={-8}
      pinLabels={{
        pin1: "IN",
        pin2: "EN",
        pin3: "GND",
        pin4: "NC",
        pin5: "FB",
        pin6: "OUT",
        pin7: "VCC",
        pin8: "PG",
      }}
    />
    <chip
      name="U3"
      footprint="soic14"
      schX={18}
      schY={-8}
      pinLabels={{
        pin1: "A0",
        pin2: "A1",
        pin3: "A2",
        pin4: "A3",
        pin5: "GND",
        pin6: "B0",
        pin7: "B1",
        pin8: "B2",
        pin9: "B3",
        pin10: "VCC",
        pin11: "Y0",
        pin12: "Y1",
        pin13: "Y2",
        pin14: "Y3",
      }}
    />
  </board>,
)

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ height: "100%" }}
    debugGrid={false}
    editingEnabled={false}
  />
)
