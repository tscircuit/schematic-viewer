import { Schematic } from "../../Schematic"

export const SchematicNetLabel2 = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <board width={10} height={10}>
        <resistor resistance="1k" name="R1" schX={-2} schY={0} />
        <resistor resistance="1k" name="R2" schX={2} schY={0} />
        <resistor
          schRotation="90deg"
          resistance="1k"
          name="R3"
          schX={0}
          schY={2}
        />
        <resistor
          schRotation="90deg"
          resistance="1k"
          name="R4"
          schX={0}
          schY={-2}
        />
        <trace from=".R1 > .right" to="net.N1" />
        <trace from=".R2 > .left" to="net.N2" />
        <trace from=".R3 > .left" to="net.N3" />
        <trace from=".R4 > .right" to="net.GND2" />
      </board>
    </Schematic>
  )
}

export default {
  title: "Basics/SchematicNetLabel2",
  component: SchematicNetLabel2,
}
