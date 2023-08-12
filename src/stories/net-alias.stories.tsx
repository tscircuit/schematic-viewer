import { Schematic } from "../Schematic"

const soup = [
  {
    type: "source_component",
    source_component_id: "net_alias_0",
    name: null,
    ftype: "net_alias",
    source: {
      type: "source_component",
      source_component_id: "net_alias_0",
      name: null,
      ftype: "net_alias",
    },
  },
  {
    type: "schematic_component",
    schematic_component_id: "schematic_net_alias_component_0",
    source_component_id: "net_alias_0",
    center: {
      x: 2,
      y: 1,
    },
    rotation: 0,
    size: {
      width: 4,
      height: 4,
    },
    source: {
      type: "source_component",
      source_component_id: "net_alias_0",
      name: null,
      ftype: "net_alias",
    },
  },
  {
    drawing_type: "box",
    type: "schematic_box",
    x: 2,
    y: 1,
    width: 4,
    height: 4,
    schematic_component_id: "schematic_net_alias_component_0",
    source: null,
  },
]

export const NetAliasSoup = () => {
  return <Schematic style={{ height: 500 }} soup={soup} />
}

export default {
  title: "NetAliasSoup",
  component: NetAliasSoup,
}
