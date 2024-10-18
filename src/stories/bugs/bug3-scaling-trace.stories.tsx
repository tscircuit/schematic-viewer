import { Schematic } from "../../Schematic"

export const Bug3ScalingTrace = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <board width={"10mm"} height={"10mm"} pcbX={0} pcbY={0}>
        <resistor name="R1" resistance="10" schX={2} schY={1} />
        <resistor
          name="R2"
          resistance="1k"
          schX={0}
          schY={3}
          symbolName="boxresistor_vert"
        />
        <trace path={[".R1 > port.right", ".R2 > port.left"]} />
      </board>
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug3ScalingTrace",
  component: Bug3ScalingTrace,
}
