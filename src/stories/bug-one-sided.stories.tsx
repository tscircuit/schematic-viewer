import { Schematic } from "Schematic"

const OneSidedBugExample = () => (
  <bug
    name="U2"
    port_arrangement={{
      left_size: 0,
      right_size: 4,
    }}
    center={[-10, 0]}
    port_labels={{
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
