import { Schematic } from "Schematic"

const BugPinSpacingExample = () => (
  <bug
    name="U2"
    schPortArrangement={{
      leftSize: 0,
      rightSize: 4,
    }}
    schX={-10}
    schY={0}
    // TODO
    // schPinSpacing="1.5mm"
    pinLabels={{
      "1": "GND",
      "2": "VBUS",
      "3": "D-",
      "4": "D+",
    }}
  />
)

export const BugPinSpacing = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <BugPinSpacingExample />
    </Schematic>
  )
}

export default {
  title: "BugPinSpacing",
  component: BugPinSpacing,
}
