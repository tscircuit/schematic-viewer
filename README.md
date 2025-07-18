# @tscircuit/schematic-viewer

React component for viewing [Circuit JSON](https://github.com/tscircuit/circuit-json) or tscircuit as a schematic

<img width="2448" height="1472" alt="image" src="https://github.com/user-attachments/assets/41e21b85-4aea-4ca2-b0f4-e57a7c477eca" />

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
