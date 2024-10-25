import { Schematic } from "Schematic"

export const Bug1YFlip = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <board width={10} height={10}>
        <bug
          name="U1"
          schPortArrangement={{ topSize: 2 }}
          pinLabels={{ 1: "foo", 2: "baz" }}
        />
      </board>
    </Schematic>
  )
}

export default {
  title: "Bugs/Bug1YFlip",
  component: Bug1YFlip,
}
