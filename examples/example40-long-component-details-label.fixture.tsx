import { SchematicComponentDetailsTooltip } from "lib/components/SchematicComponentDetailsTooltip"
import type { SourceComponent } from "lib/utils/component-details"

const switchSourceComponent: SourceComponent = {
  type: "source_component",
  source_component_id: "source_component_sw1",
  ftype: "simple_switch",
  name: "SW1",
  internally_connected_source_port_ids: [["source_port_0", "source_port_2"]],
}

export default () => (
  <div style={{ position: "relative", minHeight: 340, background: "#f8fafc" }}>
    <p style={{ margin: 16, fontFamily: "sans-serif" }}>
      Long component detail keys should wrap without overlapping their values.
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
