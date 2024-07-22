import { Schematic } from "Schematic"

export const BugConnections = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <bug
        name="B1"
        schPortArrangement={{
          leftSize: 3,
          rightSize: 2,
        }}
        schX={8}
        schY={3}
        pinLabels={{
          "1": "D0",
          "2": "D1",
        }}
      />
    </Schematic>
  )
}

export default {
  title: "BugConnections",
  component: BugConnections,
}
