import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

/**
 * Net label hover highlighting.
 *
 * The two traces below connect R2.pin1 to JUSB.pin5 and JUSB.pin8 but can't be
 * drawn as wires, so the schematic falls back to emitting a net label at each
 * endpoint (the "really-long" `R2_pin1/JUSB_pin5/JUSB_pin8` labels). Both labels
 * belong to the same net, so hovering either one highlights every label and
 * trace on that net — the same net-hover behaviour traces already have.
 */
const circuitJson = renderToCircuitJson(
  <board width="48mm" height="58mm">
    <net name="VCC" />
    <net name="GND" />
    <connector
      name="JUSB"
      schX={-1.5}
      schY={2.5}
      pinLabels={{
        pin1: "GND",
        pin2: "TRIG",
        pin3: "OUT",
        pin4: "RESET",
        pin5: "CTRL",
        pin6: "THRES",
        pin7: "DISCH",
        pin8: "VCC",
      }}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["pin1", "pin2", "pin3", "pin4"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["pin5", "pin6", "pin7", "pin8"],
        },
      }}
    />

    <resistor
      name="R2"
      resistance="10k"
      footprint="0805"
      schX={12.5}
      schY={2.5}
    />
    <chip
      name="U1"
      footprint="soic8"
      schX={5.5}
      schY={2.5}
      pinLabels={{
        pin1: "GND",
        pin2: "TRIG",
        pin3: "OUT",
        pin4: "RESET",
        pin5: "CTRL",
        pin6: "THRES",
        pin7: "DISCH",
        pin8: "VCC",
      }}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: ["RESET", "CTRL", "THRES", "TRIG"],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["VCC", "OUT", "DISCH", "GND"],
        },
      }}
    />
    {/* this trace creates "really-long" wrong net labels */}
    <trace from=".R2 > .pin1" to=".JUSB > .pin5" />
    <trace from=".R2 > .pin1" to=".JUSB > .pin8" />
  </board>,
)

export default () => (
  <div style={{ position: "relative", height: "100%" }}>
    <SchematicViewer
      circuitJson={circuitJson}
      containerStyle={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    />
  </div>
)
