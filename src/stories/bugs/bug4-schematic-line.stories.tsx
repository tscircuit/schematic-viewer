import { Schematic } from "../../Schematic"

export const Bug4SchematicLine = () => {
  return (
    <Schematic style={{ height: 500 }}>
      {/* <resistor name="R1" resistance="10" schX={2} schY={1} /> */}
      <component name="K1" schX={0} schY={0}>
        <schematicline x1={0} y1={0} x2={0} y2={2} />
      </component>
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug4SchematicLine",
  component: Bug4SchematicLine,
}
