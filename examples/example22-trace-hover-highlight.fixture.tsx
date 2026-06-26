import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

/**
 * Example demonstrating same-net trace hover highlighting (tscircuit/tscircuit#1130).
 *
 * Hover over any trace segment — all segments on the same net highlight
 * together in amber, while traces on other nets remain unchanged.
 */
export default () => (
  <SchematicViewer
    circuitJson={renderToCircuitJson(
      <board width="20mm" height="20mm">
        <resistor name="R1" resistance={1000} schX={-4} schY={0} />
        <resistor name="R2" resistance={2200} schX={0} schY={0} />
        <capacitor name="C1" capacitance="100nF" schX={4} schY={0} />
        {/* GND net: R1.pin2 -> R2.pin1 (two separate schematic trace segments) */}
        <trace from=".R1 .pin2" to=".R2 .pin1" />
        {/* signal net: R2.pin2 -> C1.pin1 */}
        <trace from=".R2 .pin2" to=".C1 .pin1" />
      </board>,
    )}
    containerStyle={{ height: "100%" }}
  />
)
