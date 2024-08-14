import { Schematic } from "../Schematic"

export const OpenSwitch = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <switch id="S1" x="2" y="1">
      </switch>
    </Schematic>
  )
}

export const ClosedSwitch = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <switch id="S2" x="2" y="1" transform="translate(0, 20)">
      </switch>
    </Schematic>
  )
}

export const RotatedSwitch = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <switch id="S3" x="2" y="1" transform="rotate(90, 2, 1)">
      </switch>
    </Schematic>
  )
}

export default {
  title: "Circuit Components/Switch",
  component: OpenSwitch,
}