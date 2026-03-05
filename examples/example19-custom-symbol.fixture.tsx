import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const triangleSvgPath = "M -0.5 -0.7 L -0.5 0.7 L 0.7 0 Z"
// Rectangle (gate style)
const rectSvgPath = "M -0.6 -0.6 L 0.6 -0.6 L 0.6 0.6 L -0.6 0.6 Z"

const circuitJson = renderToCircuitJson(
  <board width="20mm" height="20mm" routingDisabled>
    <chip
      name="U1"
      symbol={
        <symbol>
          <schematicpath
            svgPath={triangleSvgPath}
            strokeWidth={0.05}
            isFilled={false}
          />
          <port name="IN+" direction="left" />
          <port name="IN-" direction="left" />
          <port name="OUT" direction="right" />
        </symbol>
      }
    />
    <chip
      name="U2"
      symbol={
        <symbol>
          <schematicpath
            svgPath={rectSvgPath}
            strokeWidth={0.05}
            isFilled={false}
          />
          <port name="Y" direction="right" />
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
