import { Schematic } from "../../Schematic"

export const Bug6TraceScaling = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <board width={10} height={10}>
        <resistor name="R1" resistance="10 ohm" schX={2} schY={1} />
        <resistor resistance="1k" schX={1} schY={2} name="main_power" />
        <trace path={[".main_power > port.right", ".R1 > port.left"]} />
      </board>
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug6TraceScaling",
  component: Bug6TraceScaling,
}
