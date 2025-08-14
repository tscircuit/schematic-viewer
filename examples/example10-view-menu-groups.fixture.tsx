import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => {
  const circuitJson = renderToCircuitJson(
    <board width="30mm" height="20mm">
      {/* Power Supply Section */}
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
        schX={-10}
        schY={4}
      />
      <capacitor
        name="C1"
        capacitance="1000uF"
        footprint="electrolytic"
        schX={-10}
        schY={2}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0603"
        schX={-10}
        schY={0}
      />

      {/* Voltage Regulation */}
      <chip
        name="U1"
        footprint="sot223"
        pinLabels={{
          pin1: "VIN",
          pin2: "GND",
          pin3: "VOUT",
        }}
        schX={-6}
        schY={3}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        schX={-6}
        schY={1}
      />

      {/* Analog Processing */}
      <chip
        name="U2"
        footprint="soic8"
        pinLabels={{
          pin1: "IN+",
          pin2: "IN-",
          pin3: "VEE",
          pin4: "OUT",
          pin5: "NC",
          pin6: "VCC",
          pin7: "FB",
          pin8: "COMP",
        }}
        schX={-2}
        schY={3}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={-2}
        schY={1}
      />
      <resistor
        name="R3"
        resistance="22k"
        footprint="0402"
        schX={-2}
        schY={-1}
      />
      <capacitor
        name="C3"
        capacitance="10pF"
        footprint="0402"
        schX={-2}
        schY={-3}
      />

      {/* Digital Logic */}
      <chip
        name="U3"
        footprint="soic14"
        pinLabels={{
          pin1: "1A",
          pin2: "1B",
          pin3: "1Y",
          pin4: "2A",
          pin5: "2B",
          pin6: "2Y",
          pin7: "GND",
          pin8: "3Y",
          pin9: "3A",
          pin10: "3B",
          pin11: "4Y",
          pin12: "4A",
          pin13: "4B",
          pin14: "VCC",
        }}
        schX={2}
        schY={3}
      />
      <resistor
        name="R4"
        resistance="4.7k"
        footprint="0402"
        schX={2}
        schY={1}
      />
      <resistor
        name="R5"
        resistance="4.7k"
        footprint="0402"
        schX={2}
        schY={-1}
      />

      {/* Output/Display Section */}
      <led
        name="LED1"
        footprint="0603"
        schX={6}
        schY={3}
      />
      <led
        name="LED2"
        footprint="0603"
        schX={6}
        schY={1}
      />
      <led
        name="LED3"
        footprint="0603"
        schX={6}
        schY={-1}
      />
      <resistor
        name="R6"
        resistance="330"
        footprint="0402"
        schX={8}
        schY={3}
      />
      <resistor
        name="R7"
        resistance="330"
        footprint="0402"
        schX={8}
        schY={1}
      />
      <resistor
        name="R8"
        resistance="330"
        footprint="0402"
        schX={8}
        schY={-1}
      />

      {/* Additional Components for Testing */}
      <inductor
        name="L1"
        inductance="100uH"
        footprint="smd_inductor"
        schX={10}
        schY={3}
      />
      <diode
        name="D1"
        footprint="sod323"
        schX={10}
        schY={1}
      />
      <diode
        name="D2"
        footprint="sod323"
        schX={10}
        schY={-1}
      />

      {/* Crystal Oscillator */}
      <capacitor
        name="C4"
        capacitance="22pF"
        footprint="0402"
        schX={-8}
        schY={-3}
      />
      <capacitor
        name="C5"
        capacitance="22pF"
        footprint="0402"
        schX={-6}
        schY={-3}
      />

      {/* Power traces */}
      <trace from=".V1 .pin1" to=".C1 .pin1" />
      <trace from=".V1 .pin2" to=".C1 .pin2" />
      <trace from=".C1 .pin1" to=".C2 .pin1" />
      <trace from=".C1 .pin2" to=".C2 .pin2" />
      <trace from=".C1 .pin1" to=".U1 .pin1" />
      <trace from=".C1 .pin2" to=".U1 .pin2" />
      
      {/* Regulation traces */}
      <trace from=".U1 .pin3" to=".R1 .pin1" />
      <trace from=".R1 .pin2" to=".U2 .pin6" />
      
      {/* Analog traces */}
      <trace from=".U2 .pin4" to=".R2 .pin1" />
      <trace from=".R2 .pin2" to=".R3 .pin1" />
      <trace from=".R3 .pin2" to=".C3 .pin1" />
      <trace from=".U2 .pin3" to=".C3 .pin2" />
      
      {/* Digital traces */}
      <trace from=".U2 .pin4" to=".U3 .pin1" />
      <trace from=".U3 .pin3" to=".R4 .pin1" />
      <trace from=".U3 .pin6" to=".R5 .pin1" />
      
      {/* Output traces */}
      <trace from=".R4 .pin2" to=".LED1 .pin1" />
      <trace from=".R5 .pin2" to=".LED2 .pin1" />
      <trace from=".U3 .pin8" to=".LED3 .pin1" />
      <trace from=".LED1 .pin2" to=".R6 .pin1" />
      <trace from=".LED2 .pin2" to=".R7 .pin1" />
      <trace from=".LED3 .pin2" to=".R8 .pin1" />
      
      {/* Additional component traces */}
      <trace from=".R6 .pin2" to=".L1 .pin1" />
      <trace from=".L1 .pin2" to=".D1 .pin1" />
      <trace from=".D1 .pin2" to=".D2 .pin1" />
      
      {/* Crystal oscillator traces */}
      <trace from=".C4 .pin1" to=".C5 .pin1" />
      <trace from=".C4 .pin2" to=".U1 .pin2" />
      <trace from=".C5 .pin2" to=".U1 .pin2" />
      
      {/* Ground connections */}
      <trace from=".U1 .pin2" to=".U2 .pin3" />
      <trace from=".U2 .pin3" to=".U3 .pin7" />
      <trace from=".R8 .pin2" to=".D2 .pin2" />
    </board>
  )

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 1001,
          backgroundColor: "#fff",
          padding: "12px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          fontSize: "14px",
          fontFamily: "sans-serif",
          maxWidth: "300px",
        }}
      >
        <strong>View Menu Example - Complex Circuit</strong>
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
          This example demonstrates the view menu functionality with a complex circuit containing multiple component types:
          <ul style={{ margin: "8px 0", paddingLeft: "16px" }}>
            <li><strong>Chips:</strong> Voltage regulator (U1), Op-amp (U2), Logic gates (U3), Power supply (V1)</li>
            <li><strong>Resistors:</strong> 8 resistors (R1-R8) for various purposes</li>
            <li><strong>Capacitors:</strong> 5 capacitors (C1-C5) for filtering and timing</li>
            <li><strong>LEDs:</strong> 3 indicator LEDs (LED1-LED3)</li>
            <li><strong>Inductors:</strong> 1 inductor (L1) for filtering</li>
            <li><strong>Diodes:</strong> 2 diodes (D1-D2) for protection</li>
          </ul>
          Click the view menu icon (crosshair) in the top-right to filter by component types.
          <br/><br/>
          <small><strong>Test the filtering:</strong> Select different component types to see how the schematic updates to show only those components and their connections.</small>
        </div>
      </div>
      <SchematicViewer
        circuitJson={circuitJson}
        containerStyle={{ height: "100%" }}
        debugGrid
        editingEnabled
      />
    </div>
  )
}
