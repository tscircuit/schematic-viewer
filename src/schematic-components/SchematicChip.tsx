import type {
  AnyCircuitElement,
  SchematicPort as OriginalSchematicPort,
  SchematicComponent,
} from "circuit-json"
import type * as Type from "lib/types"
import { colorMap } from "lib/utils/colors"
import type React from "react"
import SVGPathComponent from "./SVGPathComponent"
import SchematicText from "./SchematicText"

interface Props {
  component: {
    source: Type.SimpleBug
    schematic: SchematicComponent
    allElements: AnyCircuitElement[]
  }
}

type ExtendedCenter = OriginalSchematicPort["center"] & {
  side: "left" | "right" | "top" | "bottom" | "center"
  pinNumber: number
  distanceFromEdge: number
  trueIndex: number
}

type SchematicPort = Omit<OriginalSchematicPort, "center"> & {
  center: ExtendedCenter
}

export const SchematicChip: React.FC<Props> = ({
  component: { source, schematic, allElements },
}) => {
  const { center, size, rotation, schematic_component_id } = schematic
  const { manufacturerPartNumber, name } = source
  const chipWidth = size.width
  const chipHeight = size.height

  const paths: Array<{
    type: "path" | "circle" | "text"
    strokeWidth: number
    stroke: string
    fill?: string
    d?: string
    cx?: number
    cy?: number
    r?: number
    text?: string
    anchor?: string
    rotation?: number
  }> = []

  // Main chip rectangle
  paths.push({
    type: "path",
    strokeWidth: 0.02,
    stroke: colorMap.schematic.component_outline,
    fill: colorMap.schematic.component_body,
    d: `M ${-chipWidth / 2},${-chipHeight / 2} h ${chipWidth} v ${chipHeight} h ${-chipWidth} Z`,
  })

  const schematicPorts = allElements.filter(
    (item): item is SchematicPort =>
      item.type === "schematic_port" &&
      item.schematic_component_id === schematic_component_id,
  )

  const portLength = 0.4
  const circleRadius = 0.05
  const labelOffset = 0.1

  const pinNumberList: Array<{
    x: number
    y: number
    text: string
    anchor: string
    rotation: number
  }> = []

  for (const port of schematicPorts) {
    const { side, pinNumber, distanceFromEdge } = port.center
    let x = 0
    let y = 0
    let endX = 0
    let endY = 0
    let pinX = 0
    let pinY = 0
    let textAnchor = "middle"
    let rotation = 0

    if (side === "center") {
      continue
    }

    switch (side) {
      case "left":
        x = -chipWidth / 2
        y = -chipHeight / 2 + distanceFromEdge
        endX = x - portLength
        endY = y
        pinX = x - portLength / 2
        pinY = y + labelOffset
        textAnchor = "middle"
        break
      case "right":
        x = chipWidth / 2
        y = chipHeight / 2 - distanceFromEdge
        endX = x + portLength
        endY = y
        pinX = x + portLength / 2 - labelOffset
        pinY = y + labelOffset
        textAnchor = "start"
        break
      case "bottom":
        x = -chipWidth / 2 + distanceFromEdge
        y = -chipHeight / 2
        endX = x
        endY = y - portLength
        pinX = x - labelOffset
        pinY = y - portLength / 2
        rotation = -90
        break
      case "top":
        x = chipWidth / 2 - distanceFromEdge
        y = chipHeight / 2
        endX = x
        endY = y + portLength
        pinX = x - labelOffset
        pinY = y + portLength / 2
        rotation = -90
        break
    }

    // Port line
    paths.push({
      type: "path",
      strokeWidth: 0.015,
      stroke: colorMap.schematic.component_outline,
      d: `M ${x},${y} L ${endX},${endY}`,
    })

    // Port circle at the end of the line
    paths.push({
      type: "circle",
      cx: endX,
      cy: endY,
      r: circleRadius,
      strokeWidth: 0.005,
      stroke: colorMap.schematic.component_outline,
      fill: colorMap.schematic.component_outline,
    })

    // Add pin number
    if (pinNumber !== undefined) {
      paths.push({
        type: "text",
        cx: pinX,
        cy: pinY,
        text: `${pinNumber}`,
        anchor: textAnchor,
        rotation: rotation,
        strokeWidth: 0.005,
        stroke: colorMap.schematic.pin_number,
      })
    }
  }

  return (
    <>
      <SVGPathComponent
        rotation={rotation}
        center={center}
        size={size}
        paths={paths as any}
      />
      <SchematicText
        schematic_text={{
          anchor: "right",
          rotation: 0,
          position: {
            x: center.x,
            y: center.y - chipHeight / 2 - 0.2,
          },
          schematic_component_id: "SYNTHETIC",
          schematic_text_id: "SYNTHETIC_MPN",
          text: manufacturerPartNumber,
          type: "schematic_text",
          color: colorMap.schematic.reference,
        }}
      />
      <SchematicText
        schematic_text={{
          anchor: "right",
          rotation: 0,
          position: {
            x: center.x,
            y: center.y + chipHeight / 2 + 0.2,
          },
          schematic_component_id: "SYNTHETIC",
          schematic_text_id: "SYNTHETIC_NAME",
          text: name,
          type: "schematic_text",
          color: colorMap.schematic.reference,
        }}
      />
    </>
  )
}

export default SchematicChip
