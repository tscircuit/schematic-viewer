import { Schematic } from "../Schematic"

export const Resistor = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <resistor name="R1" resistance="10 ohm" schX={2} schY={1} />
    </Schematic>
  )
}

export default {
  title: "Resistor",
  component: Resistor,
}
