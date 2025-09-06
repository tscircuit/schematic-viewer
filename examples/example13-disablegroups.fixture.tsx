import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board>
    <group name="Alpha Node">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} />
      <capacitor capacitance="1000pF" footprint="0402" name="C1" schX={-3} />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </group>
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
        debugGrid={false}
        editingEnabled={false}
        disableGroups
      />
    </div>
  )
}
