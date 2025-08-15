import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => {
  // Create a more complex circuit with multiple component types
  const circuitJson = renderToCircuitJson(
    <board width="25mm" height="20mm">
      {/* Power Management Group */}
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "VIN",
          pin2: "GND", 
          pin3: "EN",
          pin4: "FB",
          pin5: "VOUT",
          pin6: "SW",
          pin7: "BST",
          pin8: "VCC"
        }}
        schX={-8}
        schY={2}
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0603"
        schX={-8}
        schY={-1}
      />
      <capacitor
        name="C2" 
        capacitance="22uF"
        footprint="0805"
        schX={-5}
        schY={2}
      />

      {/* Filtering Network */}
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={3}
      />
      <resistor
        name="R2"
        resistance="1k" 
        footprint="0402"
        schX={0}
        schY={1}
      />
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="0402"
        schX={3}
        schY={2}
      />
      <capacitor
        name="C4"
        capacitance="1nF"
        footprint="0402"
        schX={3}
        schY={0}
      />

      {/* Output Stage */}
      <resistor
        name="R3"
        resistance="330"
        footprint="0402"
        schX={8}
        schY={2}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0402"
        schX={8}
        schY={0}
      />
      <led
        name="LED1"
        footprint="0603"
        schX={11}
        schY={2}
      />
      <led
        name="LED2"
        footprint="0603"
        schX={11}
        schY={0}
      />

      {/* Traces */}
      <trace from=".U1 .pin2" to=".C1 .pin2" />
      <trace from=".U1 .pin5" to=".C2 .pin1" />
      <trace from=".C2 .pin2" to=".U1 .pin2" />
      <trace from=".R1 .pin1" to=".U1 .pin5" />
      <trace from=".R1 .pin2" to=".R2 .pin1" />
      <trace from=".R2 .pin2" to=".C3 .pin1" />
      <trace from=".C3 .pin2" to=".C4 .pin1" />
      <trace from=".C4 .pin2" to=".U1 .pin2" />
      <trace from=".R3 .pin1" to=".R1 .pin2" />
      <trace from=".R3 .pin2" to=".LED1 .pin1" />
      <trace from=".R4 .pin1" to=".R2 .pin2" />
      <trace from=".R4 .pin2" to=".LED2 .pin1" />
      <trace from=".LED1 .pin2" to=".U1 .pin2" />
      <trace from=".LED2 .pin2" to=".U1 .pin2" />
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
          maxWidth: "350px",
        }}
      >
        <strong>PCB-Style Group Visualization</strong>
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
          This circuit contains multiple component types that will be automatically grouped:
          <ul style={{ margin: "8px 0", paddingLeft: "16px" }}>
            <li><span style={{color: "#FF6B6B"}}>●</span> Chips (Power management IC)</li>
            <li><span style={{color: "#4ECDC4"}}>●</span> Capacitors (Power filtering & bypass)</li>
            <li><span style={{color: "#45B7D1"}}>●</span> Resistors (Current limiting & voltage dividers)</li>
            <li><span style={{color: "#96CEB4"}}>●</span> LEDs (Status indicators)</li>
          </ul>
          Click the menu icon (⋮) → "View Schematic Groups" to see colored group boundaries with labels, similar to the PCB viewer.
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
