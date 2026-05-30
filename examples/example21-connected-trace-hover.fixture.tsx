import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="80mm" height="50mm">
    <group name="ChainA">
      <resistor name="R1" resistance={1000} schX={-20} schY={8} />
      <resistor name="R2" resistance={1000} schX={-10} schY={8} />
      <resistor name="R3" resistance={1000} schX={0} schY={8} />
      <resistor name="R4" resistance={1000} schX={10} schY={8} />
    </group>

    <group name="ChainB">
      <resistor name="R5" resistance={2200} schX={-10} schY={-8} />
      <resistor name="R6" resistance={2200} schX={0} schY={-8} />
      <resistor name="R7" resistance={2200} schX={10} schY={-8} />
    </group>

    <trace from=".R1 .pin2" to=".R2 .pin1" />
    <trace from=".R2 .pin2" to=".R3 .pin1" />
    <trace from=".R3 .pin2" to=".R4 .pin1" />

    <trace from=".R5 .pin2" to=".R6 .pin1" />
    <trace from=".R6 .pin2" to=".R7 .pin1" />
  </board>,
)

export default () => {
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <SchematicViewer
        circuitJson={circuitJson}
        containerStyle={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f8f9fa",
        }}
        editingEnabled={false}
      />
    </div>
  )
}
