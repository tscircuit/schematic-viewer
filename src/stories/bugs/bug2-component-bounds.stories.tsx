import { Schematic } from "Schematic"

const Battery = ({
  name,
  center,
  pcb_x,
  pcb_y,
}: {
  name: string
  center: [number, number]
  pcb_x: number
  pcb_y: number
}) => (
  <component
    schX={center[0]}
    schY={center[1]}
    name={name}
    pcbX={pcb_x}
    pcbY={pcb_y}
    supplierPartNumbers={{
      jlcpcb: ["C70377"],
    }}
  >
    <port name="neg" schX="-1mm" schY="0mm" direction="left" />
    <port name="pos" schX="1mm" schY="0mm" direction="right" />
    <schematicbox width="2mm" height="0.5mm" schX={0} schY={0} />
    <schematictext text={name} schX={0} schY={0} />
    <schematictext text="-" schX={-0.25} schY={-0.125} />
    <schematictext text="+" schX={0.25} schY={-0.125} />
    <smtpad
      shape="rect"
      layer="top"
      pcbX={0}
      pcbY={-26 / 2 - 3 / 2}
      width="4.2mm"
      height="3mm"
      portHints={["pos"]}
    />
    <smtpad
      shape="rect"
      layer="top"
      pcbX={0}
      pcbY={26 / 2 + 3 / 2}
      width="4.2mm"
      height="3mm"
      portHints={["neg"]}
    />
  </component>
)

export const Bug2ComponentBounds = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <Battery name="B1" center={[0, 0]} pcb_x={-30} pcb_y={30} />
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug2ComponentBounds",
  component: Bug2ComponentBounds,
}
