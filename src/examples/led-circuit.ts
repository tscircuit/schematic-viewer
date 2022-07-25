import { createProjectFromElements } from "./../lib/project/index"

export default createProjectFromElements([
  {
    type: "source_group",
    source_group_id: "source_group_1",
    children_source_component_ids: [],
    name: "Main Group",
  },
  {
    type: "schematic_group",
    schematic_group_id: "schematic_group_1",
    source_group_id: "source_group_1",
    bounds: {
      left: 0,
      right: 100,
      top: 100,
      bottom: 0,
    },
    children_schematic_component_ids: [],
    children_schematic_trace_ids: [],
  },
])
