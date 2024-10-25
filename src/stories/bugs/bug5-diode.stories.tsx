import { Schematic } from "../../Schematic"

export const Bug5SchematicLine = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <board width={10} height={10}>
        <diode name="D1" />
      </board>
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug5SchematicLine",
  component: Bug5SchematicLine,
}
