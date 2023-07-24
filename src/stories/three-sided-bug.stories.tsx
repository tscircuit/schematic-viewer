import { Schematic } from "Schematic"

export const ThreeSidedBug = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <bug
        name="B1"
        port_arrangement={{
          left_size: 3,
          right_size: 3,
          top_size: 0,
          bottom_size: 5,
        }}
        sch_cx={8}
        sch_cy={3}
        port_labels={{
          "1": "D0",
          "2": "D1",
        }}
      />
    </Schematic>
  )
}

export default {
  title: "ThreeSidedBug",
  component: ThreeSidedBug,
}
