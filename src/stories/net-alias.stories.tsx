import { Schematic } from "../Schematic"

const soup = [
  {
    type: "source_component",
    source_component_id: "net_alias_0",
    ftype: "net_alias",
    source: {
      type: "source_component",
      source_component_id: "net_alias_0",
      ftype: "net_alias",
    },
  },
  {
    type: "schematic_component",
    schematic_component_id: "schematic_net_alias_component_0",
    source_component_id: "net_alias_0",
    center: {
      x: 2,
      y: 2,
    },
    rotation: 0,
    size: {
      width: 0,
      height: 0,
    },
    source: {
      type: "source_component",
      source_component_id: "net_alias_0",
      ftype: "net_alias",
    },
  },
  {
    type: "source_port",
    name: "gnd",
    source_port_id: "source_port_0",
  },
  {
    type: "schematic_port",
    schematic_port_id: "schematic_port_0",
    source_port_id: "source_port_0",
    center: {
      x: 2,
      y: 2,
    },
    source: {
      type: "source_port",
      name: "gnd",
      source_port_id: "source_port_0",
    },
  },
  {
    drawing_type: "line",
    type: "schematic_line",
    x1: 0,
    y1: 1,
    x2: 4,
    y2: 1,
    schematic_component_id: "schematic_net_alias_component_0",
    source: null,
  },
  {
    drawing_type: "line",
    type: "schematic_line",
    x1: 2,
    y1: 1,
    x2: 2,
    y2: 2,
    schematic_component_id: "schematic_net_alias_component_0",
    source: null,
  },
  {
    anchor: "center",
    type: "schematic_text",
    position: {
      x: 2,
      y: 0.75,
    },
    text: "gnd",
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
