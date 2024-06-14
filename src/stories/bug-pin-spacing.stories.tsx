import { Schematic } from "Schematic"

const BugPinSpacingExample = () => (
  <bug
    name="U2"
    schPortArrangement={{
      leftSize: 2,
      rightSize: 2,
    }}
    schX={-10}
    schY={0}
    // TODO
    // schPinSpacing="1.5mm"
    // TODO
    // schWidth="5mm"
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
    <Schematic
      style={{ height: 600 }}
      _soupPostProcessor={(soup) => {
        return soup.map((elm) => {
          if (elm.type === "schematic_component") {
            return {
              ...elm,
              size: { width: 3, height: 3 },
              pin_spacing: 1.5,
            }
          }
          return elm
        })
      }}
    >
      <BugPinSpacingExample />
    </Schematic>
  )
}

export default {
  title: "BugPinSpacing",
  component: BugPinSpacing,
}
