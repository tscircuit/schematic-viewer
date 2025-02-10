## 🌏  Open in the Cloud 
Click any of the buttons below to start a new development environment to demo or contribute to the codebase:

[![Open in VS Code](https://img.shields.io/badge/Open%20in-VS%20Code-blue?logo=visualstudiocode)](https://vscode.dev/github/tscircuit/schematic-viewer)
[![Open in Glitch](https://img.shields.io/badge/Open%20in-Glitch-blue?logo=glitch)](https://glitch.com/edit/#!/import/github/tscircuit/schematic-viewer)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/tscircuit/schematic-viewer)
[![Edit in Codesandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/github/tscircuit/schematic-viewer)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/tscircuit/schematic-viewer)
[![Open in Repl.it](https://replit.com/badge/github/withastro/astro)](https://replit.com/github/tscircuit/schematic-viewer)
[![Open in Codeanywhere](https://codeanywhere.com/img/open-in-codeanywhere-btn.svg)](https://app.codeanywhere.com/#https://github.com/tscircuit/schematic-viewer)
[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/tscircuit/schematic-viewer)


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
