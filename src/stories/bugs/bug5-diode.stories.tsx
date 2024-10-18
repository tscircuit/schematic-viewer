import { Schematic } from "../../Schematic"

export const Bug5SchematicLine = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <diode name="D1" />
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug5SchematicLine",
  component: Bug5SchematicLine,
}
