import { Schematic } from "Schematic"

export const Bug1YFlip = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <bug
        port_arrangement={{ top_size: 2 }}
        port_labels={{ 1: "foo", 2: "baz" }}
      />
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug1YFlip",
  component: Bug1YFlip,
}
