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

Pass `onNavigateToPcbComponent` to add a **Go to PCB View** action to
component-detail popups when the selected schematic component has a matching
PCB component. The host callback receives the schematic, source, and PCB
component IDs so it can switch views without coupling this package to a PCB
viewer.
