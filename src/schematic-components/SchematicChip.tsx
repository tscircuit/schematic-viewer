import { AnyCircuitElement, SchematicPort as OriginalSchematicPort, SchematicComponent } from "circuit-json";
import * as Type from "lib/types";
import { colorMap } from "lib/utils/colors";
import React from 'react';
import SVGPathComponent from "./SVGPathComponent";
import SchematicText from "./SchematicText";

interface Props {
  component: {
    source: Type.SimpleBug;
    schematic: SchematicComponent;
    allElements: AnyCircuitElement[];
  }
}

type ExtendedCenter = OriginalSchematicPort['center'] & {
  side: "left" | "right" | "top" | "bottom";
  pinNumber: number;
  distanceFromEdge: number;
  trueIndex: number;
};

type SchematicPort = Omit<OriginalSchematicPort, 'center'> & {
  center: ExtendedCenter;
};

export const SchematicChip: React.FC<Props> = ({ component: { source, schematic, allElements } }) => {
  const { center, size, rotation, schematic_component_id } = schematic;
  const { manufacturerPartNumber, name } = source;
  const chipWidth = size.width;
  const chipHeight = size.height;

  const paths: Array<{type?: 'path' | 'circle', strokeWidth: number, stroke: string, fill?: string, d?: string, cx?: number, cy?: number, r?: number}> = [];

  // Main chip rectangle
  paths.push({
    type: 'path',
    strokeWidth: 0.02,
    stroke: colorMap.schematic.component_outline,
    fill: colorMap.schematic.component_body,
    d: `M ${-chipWidth / 2},${-chipHeight / 2} h ${chipWidth} v ${chipHeight} h ${-chipWidth} Z`,
  });

  const schematicPorts = allElements.filter(
    (item): item is SchematicPort => 
      item.type === "schematic_port" && 
      item.schematic_component_id === schematic_component_id
  );

  const portLength = 0.2;
  const circleRadius = 0.05;
  const labelOffset = 0.1;

  const pinLabels: Array<{x: number, y: number, text: string, anchor: string}> = [];

  schematicPorts.forEach((port) => {
    const { side, pinNumber, distanceFromEdge } = port.center;
    let x = 0, y = 0, endX = 0, endY = 0;
    let labelX = 0, labelY = 0;
    let textAnchor = "middle";

    switch (side) {
      case "left":
        x = -chipWidth / 2;
        y = -chipHeight / 2 + distanceFromEdge;
        endX = x - portLength;
        endY = y;
        labelX = endX;
        labelY = y + labelOffset;
        textAnchor = "end";
        break;
      case "right":
        x = chipWidth / 2;
        y = chipHeight / 2 - distanceFromEdge;
        endX = x + portLength;
        endY = y;
        labelX = endX - labelOffset;
        labelY = y + labelOffset;
        textAnchor = "start";
        break;
      case "bottom":
        x = -chipWidth / 2 + distanceFromEdge;
        y = -chipHeight / 2;
        endX = x;
        endY = y - portLength;
        labelX = x;
        labelY = endY + labelOffset;
        break;
      case "top":
        x = chipWidth / 2 - distanceFromEdge;
        y = chipHeight / 2;
        endX = x;
        endY = y + portLength;
        labelX = x;
        labelY = endY + labelOffset;
        break;
    }

    // Port line
    paths.push({
      type: 'path',
      strokeWidth: 0.02,
      stroke: colorMap.schematic.component_outline,
      d: `M ${x},${y} L ${endX},${endY}`,
    });

    // Port circle at the end of the line
    paths.push({
      type: 'circle',
      cx: endX,
      cy: endY,
      r: circleRadius,
      strokeWidth: 0.01,
      stroke: colorMap.schematic.component_outline,
      fill: colorMap.schematic.component_outline,
    });

    // Add pin label
    if(pinNumber !== undefined) {
      pinLabels.push({
        x: labelX,
        y: labelY,
        text: `${pinNumber}`,
        anchor: textAnchor
      });
    }
  });

  return (
    <>
      <SVGPathComponent
        rotation={rotation}
        center={center}
        size={size}
        paths={paths as any}
      />
      {pinLabels.map((label, index) => (
        <SchematicText
          key={index}
          schematic_text={{
            anchor: label.anchor as any,
            position: {
              x: center.x + label.x,
              y: center.y + label.y,
            },
            schematic_component_id: "SYNTHETIC",
            schematic_text_id: `PIN_LABEL_${index}`,
            text: label.text,
            type: "schematic_text",
          }}
        />
      ))}
      <SchematicText
        schematic_text={{
          anchor: "center",
          position: {
            x: center.x,
            y: center.y - chipHeight / 2 - 0.2,
          },
          schematic_component_id: "SYNTHETIC",
          schematic_text_id: "SYNTHETIC_MPN",
          text: manufacturerPartNumber,
          type: "schematic_text",
        }}
      />
      <SchematicText
        schematic_text={{
          anchor: "center",
          position: {
            x: center.x,
            y: center.y + chipHeight / 2 + 0.2,
          },
          schematic_component_id: "SYNTHETIC",
          schematic_text_id: "SYNTHETIC_NAME",
          text: name,
          type: "schematic_text",
        }}
      />
    </>
  );
};

export default SchematicChip;