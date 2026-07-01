import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

/**
 * Example demonstrating same-net trace hover highlighting (tscircuit/tscircuit#1130).
 *
 * Hover over any trace segment — every trace on the SAME NET highlights together
 * in amber, while traces on other nets are unchanged. The shared node below
 * (R2.pin1) is reached by two separate trace segments that share one net, so
 * hovering either one highlights both — that is the behavior #1130 asks for.
 */
export default () => (
  <SchematicViewer
    circuitJson={renderToCircuitJson(
      <board width="30mm" height="20mm">
        <resistor name="R1" resistance={1000} schX={-4} schY={0} />
        <resistor name="R2" resistance={2200} schX={0} schY={0} />
        <resistor name="R3" resistance={3300} schX={0} schY={3} />
        <capacitor name="C1" capacitance="100nF" schX={4} schY={0} />
        {/* Net A — one net reached by TWO trace segments through R2.pin1.
            Hovering either segment highlights the whole net. */}
        <trace from=".R1 .pin2" to=".R2 .pin1" />
        <trace from=".R2 .pin1" to=".R3 .pin1" />
        {/* Net B — a different net; stays unhighlighted when Net A is hovered. */}
        <trace from=".R2 .pin2" to=".C1 .pin1" />
      </board>,
    )}
    containerStyle={{ height: "100%" }}
  />
)
