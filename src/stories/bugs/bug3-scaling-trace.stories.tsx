import { useResistor } from "@tscircuit/react-fiber"
import { Schematic } from "../../Schematic"

export const Bug3ScalingTrace = () => {
  const R1 = useResistor("R1", { resistance: "10" })
  const R2 = useResistor("R2", { resistance: "1k" })
  return (
    <Schematic style={{ height: 500 }}>
      <R1 schX={2} schY={1} />
      <R2 schRotation="90deg" schX={0} schY={3} left={R1.left} />
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug3ScalingTrace",
  component: Bug3ScalingTrace,
}
