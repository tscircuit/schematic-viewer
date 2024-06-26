import { Schematic } from "Schematic"

const OneSidedBugExample = () => (
  <bug
    name="U2"
    schPortArrangement={{
      leftSize: 0,
      rightSize: 4,
    }}
    schX={-10}
    schY={0}
    pinLabels={{
      "1": "GND",
      "2": "VBUS",
      "3": "D-",
      "4": "D+",
    }}
  />
)

export const OneSidedBug = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <OneSidedBugExample />
    </Schematic>
  )
}

export default {
  title: "OneSidedBug",
  component: OneSidedBug,
}
