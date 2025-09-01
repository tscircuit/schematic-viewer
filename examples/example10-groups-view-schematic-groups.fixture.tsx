import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board>
    <group schX={-10} schY={10} name="Alpha Node">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} />
      <capacitor capacitance="1000pF" footprint="0402" name="C1" schX={-3} />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </group>

    <group schX={15} schY={-5} name="Blue Bridge">
      <resistor resistance="4.7k" footprint="0603" name="R2" schX={2} />
      <capacitor capacitance="220nF" footprint="0603" name="C2" schX={-2} />
      <trace from=".R2 > .pin1" to=".C2 > .pin1" />
    </group>

    <group schX={-20} schY={-15} name="Copper Point">
      <resistor resistance="10k" footprint="0805" name="R3" schX={1} />
    </group>

    <group schX={5} schY={20} name="Echo Ridge">
      <capacitor capacitance="10uF" footprint="0805" name="C4" schX={-1} />
    </group>

    <group schX={12} schY={12} name="Delta Gate">
      <resistor resistance="220" footprint="0402" name="R5" schX={3} />
      <capacitor capacitance="470pF" footprint="0402" name="C5" schX={-3} />
      <trace from=".R5 > .pin1" to=".C5 > .pin1" />
    </group>

    <group schX={-8} schY={-8} name="Flux Node">
      <resistor resistance="330" footprint="0603" name="R6" schX={2} />
    </group>

    <group schX={18} schY={-12} name="Silver Pad">
      <capacitor capacitance="1uF" footprint="0603" name="C7" schX={-2} />
    </group>

    <group schX={-14} schY={6} name="Gamma Port">
      <resistor resistance="5.6k" footprint="0402" name="R8" schX={2} />
      <capacitor capacitance="330pF" footprint="0402" name="C8" schX={-2} />
      <trace from=".R8 > .pin1" to=".C8 > .pin1" />
    </group>

    {/* Nested group example */}
    <group schX={-5} schY={-18} name="Orion Hub">
      <resistor resistance="2k" footprint="0402" name="R9" schX={2} />
      <capacitor capacitance="2.2uF" footprint="0603" name="C9" schX={-2} />
      <trace from=".R9 > .pin1" to=".C9 > .pin1" />

      <group schX={3} schY={-3} name="Nova Cell">
        <resistor resistance="6.8k" footprint="0402" name="R10" schX={1} />
        <capacitor capacitance="150pF" footprint="0402" name="C10" schX={-1} />
        <trace from=".R10 > .pin1" to=".C10 > .pin1" />
      </group>
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
      />
    </div>
  )
}
