import { Schematic } from "../../Schematic"
import * as Layout from "@tscircuit/layout"

console.log({ Layout })

export const Bug8Autolayout = () => {
  return (
    <div>
      <Schematic style={{ height: 500 }}>
        <board
          // layout={layout().autoLayoutSchematic()}
          width={"10mm"}
          height={"10mm"}
        >
          <resistor name="R1" resistance="10 ohm" schX={2} schY={1} />
          <resistor resistance="1k" schX={1} schY={2} name="main_power" />
          <trace path={[".main_power > port.right", ".R1 > port.left"]} />
        </board>
      </Schematic>
    </div>
  )
}

export default {
  title: "Bugs/Bug8Autolayout",
  component: Bug8Autolayout,
}
