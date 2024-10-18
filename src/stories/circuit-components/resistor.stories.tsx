import { Schematic } from "../../Schematic"

export const Resistor = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <board width={10} height={10}>
        <resistor name="R1" resistance="10 ohm" schX={2} schY={1} />
      </board>
    </Schematic>
  )
}

export default {
  title: "Circuit Components/Resistor",
  component: Resistor,
}
