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

Right-click a schematic and select **Run Style Analysis** to analyze the current
Circuit JSON across all sheets. A modal displays one annotated SVG per placement
or style issue, or a message when no issues are found. Analysis runs locally in
the browser and loads on demand. Close the modal and run the command again after
editing the circuit to get fresh results.

The analyzer is fetched at runtime from
`https://jscdn.tscircuit.com/@tscircuit/circuit-json-schematic-placement-analysis/latest/dist/browser.js`.
It is not included in the viewer bundle. This requires a published analyzer
release and network access to jscdn; the host page's Content Security Policy must
allow scripts from that origin. jscdn caches `latest` for up to ten minutes, and
the browser reuses an imported module until the page reloads. Circuit JSON stays
in the browser. The analyzer's GitHub dev dependency is used only by tests.
