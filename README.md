# Schematic Viewer for TSCircuit

> This is the V1 schematic viewer, it's recommended to use the new V2 version.

[![npm version](https://badge.fury.io/js/@tscircuit%2Fschematic-viewer.svg)](https://badge.fury.io/js/@tscircuit%2Fschematic-viewer)

[Examples](https://schematic-viewer.vercel.app/) &middot; [TSCircuit](https://tscircuit.com) &middot; [Open in CodeSandbox](https://codesandbox.io/s/github/tscircuit/schematic-viewer) &middot; [discord](https://tscircuit.com/join)

View schematics from [tscircuit jsx](https://tscircuit.com).

## Usage

```tsx
import { Schematic } from "@tscircuit/schematic-viewer"

// To get styles for debug table
import "react-data-grid/lib/styles.css"

export const MyReactApp = () => (
  return (
    <Schematic>
      <resistor name="R1" />
      <capacitor name="C1" />
      <trace from=".R1 > .1" to=".C1 > .plus">
    </Schematic>
  )
)

```

## References

- [SVG Path Tool](https://yqnn.github.io/svg-path-editor/)
- [SVG of Electrical Symbols Wikipedia](https://commons.wikimedia.org/wiki/File:Electrical_symbols_library.svg)
