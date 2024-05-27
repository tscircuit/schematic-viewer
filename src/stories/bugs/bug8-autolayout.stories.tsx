import { Schematic } from "../../Schematic"
import { layout } from "@tscircuit/layout"
import { useBug, useResistor, useCapacitor } from "@tscircuit/react-fiber"

export const Bug8Autolayout = () => {
  const U1 = useBug("U1", {
    pinLabels: {
      1: "VCC",
      2: "D0",
      3: "D1",
      4: "GND",
      5: "INP",
      6: "THR",
    },
    schPortArrangement: {
      leftSize: 3,
      topSize: 0,
      bottomSize: 0,
      rightSize: 3,
    },
  })

  const R1 = useResistor("R1", { resistance: "10k" })
  const R2 = useResistor("R2", { resistance: "1k" })
  const R3 = useResistor("R3", { resistance: "5k" })
  const C1 = useCapacitor("C1", { capacitance: "1uF" })

  return (
    <div>
      <Schematic style={{ height: 500 }}>
        <board
          layout={layout().autoLayoutSchematic()}
          pcbCenterX={0}
          pcbCenterY={0}
          width={"10mm"}
          height={"10mm"}
        >
          <U1 />
          <R1 left={U1.D1} right={U1.VCC} />
          <R2 left={U1.D0} right={U1.GND} />
          <R3 left={U1.INP} right={U1.THR} />
          <C1 left={U1.INP} right={U1.THR} />
        </board>
      </Schematic>
    </div>
  )
}

export default {
  title: "Bugs/Bug8Autolayout",
  component: Bug8Autolayout,
}
