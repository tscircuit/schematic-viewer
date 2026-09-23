import { useSchematicViewerController } from "lib/hooks/useSchematicViewerController"
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
  (element) => element.type === "schematic_component",
)

export default function SchematicViewerControllerFixture() {
  const { controller, focusSchematicComponent } = useSchematicViewerController()
  return (
    <div>
      <div style={{ padding: 12 }}>
        {components.map((component, index) => (
          <button
            key={component.schematic_component_id}
            onClick={() =>
              focusSchematicComponent(component.schematic_component_id)
            }
          >
            Focus U{index + 1}
          </button>
        ))}
      </div>
      <SchematicViewer
        circuitJson={circuitJson}
        controller={controller}
        searchEnabled={false}
        containerStyle={{ height: "80vh" }}
      />
    </div>
  )
}
