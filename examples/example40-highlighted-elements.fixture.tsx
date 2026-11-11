import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { useState } from "react"

const circuitJson = renderToCircuitJson(
  <board width="12mm" height="12mm">
    <resistor name="R1" resistance={1000} footprint="0603" schX={-2} />
    <capacitor name="C1" capacitance="100nF" footprint="0603" schX={2} />
    <trace from=".R1 .pin2" to=".C1 .pin1" />
    <schematictext text="Changed note" schX={0} schY={2} />
  </board>,
)
const componentIds = circuitJson.flatMap((element) =>
  element.type === "schematic_component"
    ? [element.schematic_component_id]
    : [],
)
const textIds = circuitJson.flatMap((element) =>
  element.type === "schematic_text" && !element.schematic_component_id
    ? [element.schematic_text_id]
    : [],
)

export default function HighlightedElementsFixture() {
  const [highlightedComponentIds, setHighlightedComponentIds] = useState([
    componentIds[0]!,
  ])
  const [isNoteHighlighted, setIsNoteHighlighted] = useState(true)
  return (
    <div>
      <div style={{ padding: 12, display: "flex", gap: 8 }}>
        {componentIds.map((componentId) => (
          <label key={componentId}>
            <input
              type="checkbox"
              checked={highlightedComponentIds.includes(componentId)}
              onChange={(event) =>
                setHighlightedComponentIds((ids) =>
                  event.target.checked
                    ? [...ids, componentId]
                    : ids.filter((id) => id !== componentId),
                )
              }
            />
            {componentId}
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={isNoteHighlighted}
            onChange={(event) => setIsNoteHighlighted(event.target.checked)}
          />
          note
        </label>
      </div>
      <SchematicViewer
        circuitJson={circuitJson}
        highlightedSchematicComponentIds={highlightedComponentIds}
        highlightedSchematicTextIds={isNoteHighlighted ? textIds : []}
        containerStyle={{ height: "80vh" }}
      />
    </div>
  )
}
