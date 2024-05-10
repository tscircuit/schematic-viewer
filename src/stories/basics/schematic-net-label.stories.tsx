import { Schematic } from "../../Schematic"

export const SchematicNetLabel = () => {
  return (
    <Schematic
      style={{ height: 500 }}
      soup={
        {
          elements: [
            {
              type: "source_component",
              source_component_id: "simple_resistor_0",
              name: "R1",
              supplier_part_numbers: {},
              ftype: "simple_resistor",
              resistance: 100,
              source: {
                type: "source_component",
                source_component_id: "simple_resistor_0",
                name: "R1",
                supplier_part_numbers: {},
                ftype: "simple_resistor",
                resistance: 100,
              },
            },
            {
              type: "schematic_component",
              source_component_id: "simple_resistor_0",
              schematic_component_id: "schematic_component_simple_resistor_0",
              rotation: 0,
              size: {
                width: 1,
                height: 0.3,
              },
              center: {
                x: 0,
                y: 0,
              },
              source: {
                type: "source_component",
                source_component_id: "simple_resistor_0",
                name: "R1",
                supplier_part_numbers: {},
                ftype: "simple_resistor",
                resistance: 100,
              },
            },
            {
              type: "source_port",
              name: "left",
              source_port_id: "source_port_0",
              source_component_id: "simple_resistor_0",
              source: {
                type: "source_component",
                source_component_id: "simple_resistor_0",
                name: "R1",
                supplier_part_numbers: {},
                ftype: "simple_resistor",
                resistance: 100,
              },
            },
            {
              type: "schematic_port",
              schematic_port_id: "schematic_port_0",
              source_port_id: "source_port_0",
              center: {
                x: -0.5,
                y: 0,
              },
              facing_direction: "left",
              schematic_component_id: "schematic_component_simple_resistor_0",
              source: {
                type: "source_port",
                name: "left",
                source_port_id: "source_port_0",
                source_component_id: "simple_resistor_0",
              },
            },
            {
              type: "source_port",
              name: "right",
              source_port_id: "source_port_1",
              source_component_id: "simple_resistor_0",
              source: {
                type: "source_component",
                source_component_id: "simple_resistor_0",
                name: "R1",
                supplier_part_numbers: {},
                ftype: "simple_resistor",
                resistance: 100,
              },
            },
            {
              type: "schematic_port",
              schematic_port_id: "schematic_port_1",
              source_port_id: "source_port_1",
              center: {
                x: 0.5,
                y: 0,
              },
              facing_direction: "right",
              schematic_component_id: "schematic_component_simple_resistor_0",
              source: {
                type: "source_port",
                name: "right",
                source_port_id: "source_port_1",
                source_component_id: "simple_resistor_0",
              },
            },
            {
              type: "schematic_text",
              text: "R1",
              schematic_text_id: "schematic_text_0",
              schematic_component_id: "schematic_component_simple_resistor_0",
              anchor: "left",
              position: {
                x: -0.2,
                y: -0.5,
              },
              rotation: 0,
              source: null,
            },
            {
              type: "schematic_text",
              text: 100,
              schematic_text_id: "schematic_text_1",
              schematic_component_id: "schematic_component_simple_resistor_0",
              anchor: "left",
              position: {
                x: -0.2,
                y: -0.3,
              },
              rotation: 0,
              source: null,
            },
            {
              type: "source_net",
              member_source_group_ids: [],
              source_net_id: "net_0",
              name: "GND",
              source: null,
            },
            {
              type: "source_trace",
              connected_source_port_ids: ["source_port_1"],
              connected_source_net_ids: ["net_0"],
              source_trace_id: "source_trace_0",
              source: null,
            },
            {
              type: "schematic_net_label",
              source_net_id: "net_0",
              text: "GND",
              anchor_side: "left",
              center: {
                x: 1.5,
                y: 0,
              },
              source: null,
            },
          ],
        }.elements
      }
    />
  )
}

export default {
  title: "Basics/SchematicNetLabel",
  component: SchematicNetLabel,
}
