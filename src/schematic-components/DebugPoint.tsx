import React from "react"
import { SVGPathComponent } from "./SVGPathComponent"

export const DebugPoint = ({
  center,
}: {
  center: { x: number; y: number }
}) => {
  return (
    <SVGPathComponent
      rotation={0}
      center={center}
      size={{ width: 0.02, height: 0.02 }}
      paths={[
        {
          stroke: "red",
          strokeWidth: 0.5,
          // d: "M -1 -1 l 1 1 M -1 1 l 1 -1",
          //square
          d: "M -1 -1 l 2 0 l 0 2 l -2 0 l 0 -2",
        },
      ]}
    />
  )
}
