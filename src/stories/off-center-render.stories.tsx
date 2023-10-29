import { Schematic } from "Schematic"

export const OffCenterRendering = () => {
  return (
    <>
      <div style={{ height: 600 }}>scroll down</div>
      <Schematic style={{ height: 600 }}>
        <bug
          name="B1"
          port_arrangement={{
            left_size: 3,
            right_size: 2,
          }}
          sch_cx={8}
          sch_cy={3}
          port_labels={{
            "1": "D0",
            "2": "D1",
          }}
        />
      </Schematic>
    </>
  )
}

export default {
  title: "OffCenterRendering",
  component: OffCenterRendering,
}
