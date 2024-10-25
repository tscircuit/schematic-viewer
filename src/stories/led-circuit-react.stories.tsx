import { Schematic } from "../Schematic"

export const LEDCircuitReact = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <group>
        <resistor name="R1" resistance="10 ohm" schX={2} schY={1} />
        <capacitor
          name="C1"
          capacitance="10 uF"
          schX={4}
          schY={2}
          symbolName="capacitor_vert"
        />
        <resistor name="R2" resistance="10 ohm" schX={6} schY={1} />
        <trace path={[".R1 > port.right", ".C1 > port.left"]} />
        <trace path={[".C1 > port.right", ".R2 > port.left"]} />
        <powersource voltage={5} schX={1} schY={2} name="main_power" />
        <trace path={[".main_power > port.positive", ".R1 > port.left"]} />
        <trace path={[".main_power > port.negative", ".C1 > port.right"]} />
        <trace path={[".C1 > port.right", ".R2 > port.right"]} />
        <bug
          name="B1"
          schPortArrangement={{
            leftSide: { pins: [3, 2, 1], direction: "top-to-bottom" },
            rightSide: { pins: [6, 5, 4], direction: "top-to-bottom" },
          }}
          // schWidth={4}
          schX={8}
          schY={3}
          pinLabels={{
            1: "PWR",
            2: "NC",
            3: "RG",
            4: "D0",
            5: "D1",
            6: "GND",
          }}
        />
      </group>
    </Schematic>
  )
}

export default {
  title: "LEDCircuitReact",
  component: LEDCircuitReact,
}
