import { Schematic } from "../Schematic"

export const RotatedResistor = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <resistor
        name="R1"
        resistance="10 ohm"
        schX={2}
        schY={1}
        schRotation="90deg"
        rotation="90deg"
      />
    </Schematic>
  )
}

export default {
  title: "RotatedResistor",
  component: RotatedResistor,
}
