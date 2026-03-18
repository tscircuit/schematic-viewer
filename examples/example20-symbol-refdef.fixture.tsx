import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm">
    <chip
      name="U1"
      symbol={
        <symbol>
          <schematictext schX={0} schY={1} text="{NAME}" fontSize={0.2} />
          <schematicline
            x1={-0.5}
            y1={-0.7}
            x2={-0.5}
            y2={0.7}
            strokeWidth={0.05}
          />

          <schematicline
            x1={-0.5}
            y1={0.7}
            x2={0.7}
            y2={0}
            strokeWidth={0.05}
          />

          <schematicline
            x1={0.7}
            y1={0}
            x2={-0.5}
            y2={-0.7}
            strokeWidth={0.05}
          />

          <schematictext schX={-0.35} schY={0.35} text="+" fontSize={0.3} />

          <schematictext schX={-0.35} schY={-0.35} text="-" fontSize={0.3} />

          <port
            name="IN_POS"
            schX={-1}
            schY={0.35}
            direction="left"
            schStemLength={0.5}
          />

          <port
            name="IN_NEG"
            schX={-1}
            schY={-0.35}
            direction="left"
            schStemLength={0.5}
          />

          <port
            name="OUT"
            schX={1.2}
            schY={0}
            direction="right"
            schStemLength={0.5}
          />
        </symbol>
      }
    />
  </board>,
)

export default () => (
  <SchematicViewer
    circuitJson={circuitJson}
    containerStyle={{ height: "100%" }}
  />
)
