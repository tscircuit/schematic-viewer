import { Schematic } from "../../Schematic"

export const Diode = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <board width={10} height={10}>
        <diode name="D1" schX={2} schY={1} />
      </board>
    </Schematic>
  )
}

export default {
  title: "Circuit Components/Diode",
  component: Diode,
}
