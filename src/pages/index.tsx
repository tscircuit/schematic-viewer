import "@tscircuit/react-fiber/dist/types/intrinsic-jsx.d"
import { Schematic } from "Schematic"

export default () => {
  return (
    <Schematic>
      <resistor name="R1" resistance="10 ohm" />
    </Schematic>
  )
}
