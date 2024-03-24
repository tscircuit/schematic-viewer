import { AnyElement } from "lib/types"
import { Schematic } from "../Schematic"

const soup: AnyElement[] = []

export const SchematicPathSoup = () => {
  return <Schematic style={{ height: 500 }} soup={soup} />
}

export default {
  title: "SchematicPathSoup",
  component: SchematicPathSoup,
}
