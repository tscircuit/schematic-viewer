import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => {
  const circuitJson = renderToCircuitJson(
    <board width="50mm" height="30mm">
      {/* Power Management Group */}
      <group name="Power Management">
        <chip 
          name="U1" 
          footprint="soic8" 
          schX={-10} 
          schY={5}
          pinLabels={{
            "1": "VIN",
            "2": "GND", 
            "3": "EN",
            "4": "FB",
            "5": "VOUT",
            "6": "SW",
            "7": "PGND",
            "8": "VCC"
          }}
        />
        <capacitor name="C1" capacitance="100uF" schX={-15} schY={2} />
        <capacitor name="C2" capacitance="22uF" schX={-5} schY={2} />
        <resistor name="R1" resistance={10000} schX={-10} schY={8} />
      </group>

      {/* Signal Processing Group */}
      <group name="Signal Processing">
        <chip 
          name="U2" 
          footprint="soic14" 
          schX={5} 
          schY={5}
          pinLabels={{
            "1": "IN+",
            "2": "IN-",
            "3": "VCC",
            "4": "GND",
            "5": "OUT1",
            "6": "OUT2",
            "7": "REF"
          }}
        />
        <resistor name="R2" resistance={1000} schX={0} schY={8} />
        <resistor name="R3" resistance={2000} schX={10} schY={8} />
        <capacitor name="C3" capacitance="10nF" schX={5} schY={2} />
      </group>

      {/* Status Indicators Group */}
      <group name="Status Indicators">
        <led name="LED1" schX={15} schY={5} />
        <led name="LED2" schX={20} schY={5} />
        <resistor name="R4" resistance={330} schX={15} schY={8} />
        <resistor name="R5" resistance={330} schX={20} schY={8} />
      </group>

      {/* Connections between groups */}
      <trace from=".U1 .pin5" to=".U2 .pin3" />
      <trace from=".U2 .pin5" to=".LED1 .pin1" />
      <trace from=".U2 .pin6" to=".LED2 .pin1" />
      <trace from=".C1 .pin1" to=".U1 .pin1" />
      <trace from=".C2 .pin1" to=".U1 .pin5" />
      <trace from=".R1 .pin1" to=".U1 .pin3" />
      <trace from=".R2 .pin1" to=".U2 .pin1" />
      <trace from=".R3 .pin1" to=".U2 .pin2" />
      <trace from=".C3 .pin1" to=".U2 .pin7" />
      <trace from=".R4 .pin1" to=".LED1 .pin2" />
      <trace from=".R5 .pin1" to=".LED2 .pin2" />
    </board>,
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
          maxWidth: "400px",
        }}
      >
        <strong>Multiple Groups Example</strong>
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
          This circuit contains 3 explicit groups:
          <br />
          <br />
          <span style={{ color: "#FF6B6B" }}>🔴 Power Management</span>
          <br />
          • Voltage regulator IC (U1)
          <br />
          • Input/output capacitors (C1, C2)
          <br />
          • Enable resistor (R1)
          <br />
          <br />
          <span style={{ color: "#4ECDC4" }}>🔵 Signal Processing</span>
          <br />
          • Op-amp IC (U2)
          <br />
          • Input resistors (R2, R3)
          <br />
          • Reference capacitor (C3)
          <br />
          <br />
          <span style={{ color: "#45B7D1" }}>🟢 Status Indicators</span>
          <br />
          • Status LEDs (LED1, LED2)
          <br />
          • Current limiting resistors (R4, R5)
          <br />
          <br />
          <strong>Click the menu (⋮) → "View Schematic Groups"</strong>
          <br />
          to see colored group boundaries!
        </div>
      </div>

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
