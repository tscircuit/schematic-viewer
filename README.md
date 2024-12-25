# @tscircuit/schematic-viewer

React component for viewing [Circuit JSON](https://github.com/tscircuit/circuit-json) or tscircuit as a schematic

> [!WARNING]
> This is the 2.X.X schematic viewer, you may want to use the [old 1.X.X version](https://github.com/tscircuit/schematic-viewer/tree/v1)

```tsx
import { SchematicViewer } from "@tscircuit/schematic-viewer"

export default () => (
  <SchematicViewer
    circuitJson={renderToCircuitJson(
      <board width="10mm" height="10mm">
        <resistor name="R1" resistance={1000} schX={-2} />
        <capacitor name="C1" capacitance="1uF" schX={2} />
        <trace from=".R1 .pin2" to=".C1 .pin1" />
      </board>
    )}
  />
)
```
