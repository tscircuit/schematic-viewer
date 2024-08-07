import { Schematic } from "Schematic"

export const OffCenterRendering = () => {
  return (
    <>
      <div style={{ height: 600 }}>scroll down</div>
      <Schematic style={{ height: 600 }}>
        <bug
          name="B1"
          schPortArrangement={{
            leftSide: { pins: [3, 2, 1], direction: "top-to-bottom" },
            rightSide: { pins: [6, 5, 4], direction: "top-to-bottom" },
          }}
          schX={8}
          schY={3}
          pinLabels={{
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
