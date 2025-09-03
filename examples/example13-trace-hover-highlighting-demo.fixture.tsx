import { renderToCircuitJson } from "lib/dev/render-to-circuit-json";
import { SchematicViewer } from "lib/index";

const circuit = (
  <board width="80mm" height="60mm">
    {/* Components */}
    <chip name="U1" footprint="dip8" pcbX={10} pcbY={10} />
    <chip name="U2" footprint="dip8" pcbX={50} pcbY={10} />
    <resistor name="R1" resistance="1000 ohm" pcbX={30} pcbY={30} />
    <resistor name="R2" resistance="330 ohm" pcbX={60} pcbY={30} />
    <capacitor name="C1" capacitance="100 nF" pcbX={20} pcbY={40} />
    <capacitor name="C2" capacitance="10 uF" pcbX={40} pcbY={40} />
    <led name="LED1" pcbX={70} pcbY={40} />

    {/* VCC POWER RAIL: Multiple traces connecting VCC pins and capacitor positive terminals */}
    <trace from={".U1 > .pin8"} to={".U2 > .pin8"} />
    <trace from={".U1 > .pin8"} to={".C1 > .pin1"} />
    <trace from={".C1 > .pin1"} to={".C2 > .pin1"} />

    {/* GROUND RAIL: Multiple traces connecting GND pins and capacitor negative terminals */}
    <trace from={".U1 > .pin4"} to={".U2 > .pin4"} />
    <trace from={".U1 > .pin4"} to={".C1 > .pin2"} />
    <trace from={".C1 > .pin2"} to={".C2 > .pin2"} />
    <trace from={".C2 > .pin2"} to={".R1 > .pin2"} />

    {/* SIGNAL NET 1: U1 output through R2 to LED */}
    <trace from={".U1 > .pin1"} to={".R2 > .pin1"} />
    <trace from={".R2 > .pin2"} to={".LED1 > .anode"} />

    {/* SIGNAL NET 2: U1 to U2 communication */}
    <trace from={".U1 > .pin2"} to={".U2 > .pin1"} />

    {/* SIGNAL NET 3: U2 output through R1 to ground (current sink) */}
    <trace from={".U2 > .pin7"} to={".R1 > .pin1"} />

    {/* LED cathode to ground */}
    <trace from={".LED1 > .cathode"} to={".U2 > .pin4"} />

    {/* Internal chip connections (isolated) */}
    <trace from={".U1 > .pin3"} to={".U1 > .pin6"} />
    <trace from={".U2 > .pin2"} to={".U2 > .pin3"} />
  </board>
);

/**
 * Example showcasing the new trace hover highlighting feature
 *
 * Hover over any trace to see all connected traces in the same net highlighted.
 * This helps visualize circuit connectivity and debug routing issues.
 */
export default () => {
  const circuitJson = renderToCircuitJson(circuit);

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <SchematicViewer
        circuitJson={circuitJson}
        containerStyle={{ height: "100%" }}
        debugGrid
        editingEnabled
      />
    </div>
  );
};
