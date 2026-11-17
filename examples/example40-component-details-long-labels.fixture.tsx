import { SchematicComponentDetailsTooltip } from "lib/components/SchematicComponentDetailsTooltip"
import type { SourceComponent } from "lib/utils/component-details"

const sourceComponent: SourceComponent = {
  type: "source_component",
  source_component_id: "source_component_0",
  ftype: "simple_chip",
  name: "J_MOTOR",
  manufacturer_part_number: "BM04B-SRSS-TB(LF)(SN)",
  internally_connected_source_port_ids: [["source_port_44", "source_port_45"]],
}

export default () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 32, padding: 24 }}>
    {[420, 300].map((width) => (
      <div key={width} style={{ width }}>
        <p>{width}px tooltip</p>
        <div style={{ position: "relative", height: 260 }}>
          <SchematicComponentDetailsTooltip
            sourceComponent={sourceComponent}
            left={0}
            top={0}
            width={width}
            maxHeight={260}
          />
        </div>
      </div>
    ))}
  </div>
)
