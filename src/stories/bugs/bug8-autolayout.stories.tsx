import { layout } from "@tscircuit/layout"
import { Schematic } from "../../Schematic"

export const Bug8Autolayout = () => {
  return (
    <div>
      <Schematic style={{ height: 500 }}>
        <board
          layout={layout().autoLayoutSchematic()}
          pcbX={0}
          pcbY={0}
          width={"10mm"}
          height={"10mm"}
        >
          <bug
            name="U1"
            schX={0}
            schY={0}
            schPortArrangement={{
              leftSize: 3,
              topSize: 0,
              bottomSize: 0,
              rightSize: 3,
            }}
          />
          <resistor name="R1" resistance="10k" schX={0} schY={1} />
          <resistor name="R2" resistance="1k" schX={0} schY={3} />
          <resistor name="R3" resistance="5k" schX={2} schY={1} />
          <capacitor name="C1" capacitance="1uF" schX={2} schY={3} />
          <trace path={[".R1 > port.right", ".R2 > port.left"]} />
          <trace path={[".R2 > port.right", ".R3 > port.left"]} />
          <trace path={[".R3 > port.right", ".C1 > port.left"]} />
          <trace path={[".C1 > port.right", ".R1 > port.left"]} />
        </board>
      </Schematic>
    </div>
  )
}

export default {
  title: "Bugs/Bug8Autolayout",
  component: Bug8Autolayout,
}
