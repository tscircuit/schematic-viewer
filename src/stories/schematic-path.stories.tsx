import { AnyElement } from "lib/types"
import { Schematic } from "../Schematic"

const soup: AnyElement[] = [
  {
    type: "source_component",
    source_component_id: "source_component_1",
    name: "my source component",
  },
  {
    type: "schematic_component",
    schematic_component_id: "schematic_component_1",
    center: { x: 0, y: 0 },
    rotation: 0,
    size: { width: 1, height: 1 },
    source_component_id: "source_component_1",
  },
  {
    type: "schematic_path",
    drawing_type: "path",
    is_filled: true,
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    schematic_component_id: "schematic_component_1",
  },
]

export const SchematicPathSoup = () => {
  return <Schematic style={{ height: 500 }} soup={soup} />
}

export default {
  title: "SchematicPathSoup",
  component: SchematicPathSoup,
}
