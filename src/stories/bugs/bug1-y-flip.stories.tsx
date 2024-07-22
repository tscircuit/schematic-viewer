import { Schematic } from "Schematic"

export const Bug1YFlip = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <bug
        name="U1"
        schPortArrangement={{ topSize: 2 }}
        pinLabels={{ 1: "foo", 2: "baz" }}
      />
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug1YFlip",
  component: Bug1YFlip,
}
