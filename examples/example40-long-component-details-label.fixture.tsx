import { SchematicComponentDetailsTooltip } from "lib/components/SchematicComponentDetailsTooltip"
import type { SourceComponent } from "lib/utils/component-details"

const switchSourceComponent: SourceComponent = {
  type: "source_component",
  source_component_id: "source_component_sw1",
  ftype: "simple_switch",
  name: "SW1",
  manufacturer_part_number: "TL3342",
  internally_connected_source_port_ids: [["source_port_0", "source_port_2"]],
}

export default () => (
  <div style={{ position: "relative", minHeight: 340, background: "#f8fafc" }}>
    <p style={{ margin: 16, fontFamily: "sans-serif" }}>
      Internal IDs should be hidden. The component name and part number remain.
    </p>
    <SchematicComponentDetailsTooltip
      sourceComponent={switchSourceComponent}
      left={16}
      top={60}
      width={560}
      maxHeight={260}
    />
  </div>
)
