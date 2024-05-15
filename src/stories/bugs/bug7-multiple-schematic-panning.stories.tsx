import { Schematic } from "../../Schematic"

export const Bug7MultipleSchematicPanning = () => {
  return (
    <div>
      <Schematic style={{ height: 500 }}>
        <resistor name="R1" resistance="10 ohm" schX={2} schY={1} />
        <resistor resistance="1k" schX={1} schY={2} name="main_power" />
        <trace path={[".main_power > port.right", ".R1 > port.left"]} />
      </Schematic>
      <Schematic style={{ height: 500 }}>
        <resistor name="R1" resistance="10 ohm" schX={2} schY={1} />
        <resistor resistance="1k" schX={1} schY={2} name="main_power" />
        <trace path={[".main_power > port.right", ".R1 > port.left"]} />
      </Schematic>
    </div>
  )
}

export default {
  title: "Bugs/Bug7MultipleSchematicPanning",
  component: Bug7MultipleSchematicPanning,
}
