import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => {
  const circuitJson = renderToCircuitJson(
    <board width="20mm" height="15mm">
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
        schX={-6}
        schY={2}
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0603"
        schX={-6}
        schY={-1}
      />
      <resistor name="R1" resistance="1k" footprint="0402" schX={0} schY={2} />
      <resistor name="R2" resistance="2k" footprint="0402" schX={0} schY={0} />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        schX={0}
        schY={-2}
      />
      <resistor name="R3" resistance="10k" footprint="0402" schX={6} schY={1} />
      <led name="LED1" footprint="0603" schX={6} schY={-1} />

      {/* Traces */}
      <trace from=".V1 .pin2" to=".C1 .pin2" />
      <trace from=".V1 .pin1" to=".C1 .pin1" />
      <trace from=".R1 .pin2" to=".R2 .pin1" />
      <trace from=".R2 .pin2" to=".C2 .pin1" />
      <trace from=".R3 .pin2" to=".LED1 .pin1" />
      <trace from=".V1 .pin1" to=".R1 .pin1" />
      <trace from=".R2 .pin2" to=".R3 .pin1" />
      <trace from=".V1 .pin2" to=".C2 .pin2" />
      <trace from=".C2 .pin2" to=".LED1 .pin2" />
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
          maxWidth: "300px",
        }}
      >
        <strong>View Menu Example</strong>
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
          This example demonstrates the view menu functionality. The circuit
          contains different component types:
          <ul style={{ margin: "8px 0", paddingLeft: "16px" }}>
            <li>Power section (voltage source V1 & capacitor C1)</li>
            <li>Filter section (resistors R1, R2 & capacitor C2)</li>
            <li>Output section (resistor R3 & LED1)</li>
          </ul>
          Click the menu icon (⋮) in the top-right to toggle group visibility.
          <br />
          <br />
          <small>
            Note: Groups are automatically created by component type and
            displayed as colored overlays when enabled.
          </small>
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
