import { ControlledSchematicViewer } from "lib/components/ControlledSchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <ControlledSchematicViewer
    circuitJson={renderToCircuitJson(
      <board width="10mm" height="10mm">
        <chip
          name="U1"
          schX={2}
          symbol={
            <symbol>
              <schematicpath
                points={[
                  { x: 0, y: 0 },
                  { x: 2, y: 0 },
                  { x: 1, y: 2 },
                ]}
                isFilled={true}
                fillColor="red"
              />
            </symbol>
          }
        />
      </board>,
    )}
    containerStyle={{ height: "100%" }}
    debugGrid
  />
)
