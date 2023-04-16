import React, { Fragment } from "react"
import "@tscircuit/react-fiber/src/types/intrinsic-jsx"

export const ExampleCircuit = () => {
  return (
    <Fragment>
      <resistor name="R1" resistance="10 ohm" center={[2, 1]} />
      <capacitor
        name="C1"
        capacitance="10 uF"
        center={[4, 2]}
        rotation="90deg"
      />
      <resistor name="R2" reistance="10 ohm" center={[6, 1]} rotation="90deg" />
      <trace
        path={[".R1 > port.right", ".C1 > port.left", ".R2 > port.left"]}
      />
      <powersource voltage="5V" center={[1, 2]} name="main_power" />
      <trace path={[".main_power > port.positive", ".R1 > port.left"]} />
      <trace
        path={["power > port.negative", ".C1 > port.right", ".R2 > port.right"]}
      />
      <bug
        name="B1"
        port_arrangement={{ left_size: 3, right_size: 3 }}
        center={[8, 3]}
        portLabels={{
          1: "PWR",
          2: "NC",
          3: "RG",
          4: "D0",
          5: "D1",
          6: "GND",
        }}
      />
      <trace path={[".B1 > port.PWR", ".R2 > port.left"]} />
      <ground name="GND" center={[11, 3]} />
      <trace from=".B1 > port.GND" to=".GND" />
      <diode name="D1" center={[6, 3.5]} rotation="180deg" />
      <trace from=".D1 > .left" to=".B1 > .RG" />
      <trace from=".D1 > .right" to=".C1> .right" />
    </Fragment>
  )
}

export default ExampleCircuit
