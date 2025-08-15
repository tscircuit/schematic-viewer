import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => {
  const circuitJson = renderToCircuitJson(
    <board width="60mm" height="40mm">
      {/* Multiple Resistors - Will form "Resistors" group */}
      <resistor name="R1" resistance={1000} schX={-15} schY={5} />
      <resistor name="R2" resistance={2200} schX={-10} schY={5} />
      <resistor name="R3" resistance={4700} schX={-5} schY={5} />
      <resistor name="R4" resistance={330} schX={0} schY={8} />
      <resistor name="R5" resistance={220} schX={5} schY={8} />

      {/* Multiple Capacitors - Will form "Capacitors" group */}
      <capacitor name="C1" capacitance="100uF" schX={-15} schY={0} />
      <capacitor name="C2" capacitance="10uF" schX={-10} schY={0} />
      <capacitor name="C3" capacitance="1uF" schX={-5} schY={0} />
      <capacitor name="C4" capacitance="100nF" schX={0} schY={0} />

      {/* Multiple ICs/Chips - Will form "Chips" group */}
      <chip 
        name="U1" 
        footprint="soic8" 
        schX={10} 
        schY={5}
        pinLabels={{
          "1": "VIN",
          "2": "GND", 
          "3": "EN",
          "4": "VOUT"
        }}
      />
      <chip 
        name="U2" 
        footprint="soic14" 
        schX={15} 
        schY={5}
        pinLabels={{
          "1": "IN",
          "2": "OUT",
          "3": "VCC",
          "4": "GND"
        }}
      />
      <chip 
        name="U3" 
        footprint="sot23" 
        schX={20} 
        schY={5}
        pinLabels={{
          "1": "A",
          "2": "B", 
          "3": "C"
        }}
      />

      {/* Multiple LEDs - Will form "Leds" group */}
      <led name="LED1" schX={10} schY={0} />
      <led name="LED2" schX={15} schY={0} />
      <led name="LED3" schX={20} schY={0} />

      {/* Multiple Inductors - Will form "Inductors" group */}
      <inductor name="L1" inductance="100uH" schX={-15} schY={-5} />
      <inductor name="L2" inductance="22uH" schX={-10} schY={-5} />

      {/* Multiple Diodes - Will form "Diodes" group */}
      <diode name="D1" schX={-5} schY={-5} />
      <diode name="D2" schX={0} schY={-5} />

      {/* Some connections */}
      <trace from=".R1 .pin2" to=".R2 .pin1" />
      <trace from=".R2 .pin2" to=".R3 .pin1" />
      <trace from=".C1 .pin1" to=".U1 .pin1" />
      <trace from=".C2 .pin1" to=".U2 .pin3" />
      <trace from=".U1 .pin4" to=".LED1 .pin1" />
      <trace from=".U2 .pin2" to=".LED2 .pin1" />
      <trace from=".R4 .pin1" to=".LED1 .pin2" />
      <trace from=".R5 .pin1" to=".LED2 .pin2" />
      <trace from=".L1 .pin1" to=".D1 .pin1" />
      <trace from=".L2 .pin1" to=".D2 .pin1" />
    </board>,
  )

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <SchematicViewer
        circuitJson={circuitJson}
        containerStyle={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f8f9fa",
        }}
        debugGrid={false}
        editingEnabled={false}
      />
    </div>
  )
}
