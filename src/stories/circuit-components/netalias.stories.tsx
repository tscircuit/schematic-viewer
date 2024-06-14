import { Schematic } from "../../Schematic"

export const NetAlias = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <netalias net="GND" />
    </Schematic>
  )
}

export default {
  title: "Circuit Components/NetAlias",
  component: NetAlias,
}
