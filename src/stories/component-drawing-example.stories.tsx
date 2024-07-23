import { Schematic } from "Schematic"

export const ComponentDrawingExample = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <component name={"C1"}>
        <schematicbox schX={0} schY={0} width="6mm" height="6mm" />
        <schematicline x1={0} y1={0} x2={1} y2={1} />
      </component>
    </Schematic>
  )
}

export default {
  title: "ComponentDrawingExample",
  component: ComponentDrawingExample,
}
