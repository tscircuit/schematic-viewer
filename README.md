# Schematic Viewer for TSCircuit

[![npm version](https://badge.fury.io/js/@tscircuit%2Fschematic-viewer.svg)](https://badge.fury.io/js/@tscircuit%2Fschematic-viewer)

[Examples](https://schematic-viewer.vercel.app/) &middot; [TSCircuit](https://tscircuit.com) &middot; [Open in CodeSandbox](https://codesandbox.io/s/github/tscircuit/schematic-viewer)

View schematics from [tscircuit jsx](https://tscircuit.com).

## Usage

```tsx
import { Schematic } from "tscircuit"
// import { Schematic } from "@tscircuit/schematic-viewer"

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
