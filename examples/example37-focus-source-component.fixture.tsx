import { useState } from "react"
import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board routingDisabled>
    <schematicsheet name="First" sheetIndex={0} />
    <schematicsheet name="Second" sheetIndex={1} />
    <subcircuit name="FIRST" schSheetName="First">
      <chip name="U1" footprint="soic8" manufacturerPartNumber="NE555DR" />
    </subcircuit>
    <subcircuit name="SECOND" schSheetName="Second">
      <chip name="U2" footprint="soic8" manufacturerPartNumber="NE555DR" />
    </subcircuit>
  </board>,
)
const components = circuitJson.filter(
  (element) =>
    element.type === "source_component" && element.ftype === "simple_chip",
)

export default function FocusSourceComponent() {
  const [sourceComponentId, setSourceComponentId] = useState(
    components[1]?.source_component_id,
  )
  return (
    <div>
      <div style={{ padding: 12 }}>
        {components.map((component) => (
          <button
            key={component.source_component_id}
            onClick={() => setSourceComponentId(component.source_component_id)}
          >
            Focus {component.name}
          </button>
        ))}
      </div>
      <SchematicViewer
        circuitJson={circuitJson}
        focusSourceComponentId={sourceComponentId}
        searchEnabled={false}
        containerStyle={{ height: "80vh" }}
      />
    </div>
  )
}
