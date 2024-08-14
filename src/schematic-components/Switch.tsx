import React from 'react';
import { SchematicComponent, Point } from '../lib/types/core';

interface SwitchProps extends SchematicComponent {
  closed?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  schematic_component_id,
  rotation,
  size,
  center,
  closed = false,
}) => {
  const width = size.width;
  const height = size.height;

  const transform = `rotate(${rotation} ${center.x} ${center.y})`;

  const calculatePoint = (x: number, y: number): Point => ({
    x: center.x + x - width / 2,
    y: center.y + y - height / 2,
  });

  const startPoint = calculatePoint(width * 0.1, height / 2);
  const midPoint = calculatePoint(width * 0.3, height / 2);
  const endPoint = calculatePoint(width * 0.9, height / 2);
  const switchPoint = calculatePoint(width * 0.7, closed ? height / 2 : height / 6);

  return (
    <g id={schematic_component_id} transform={transform}>
      <line
        x1={startPoint.x}
        y1={startPoint.y}
        x2={midPoint.x}
        y2={midPoint.y}
        stroke="black"
        strokeWidth="2"
      />
      
      <line
        x1={midPoint.x}
        y1={midPoint.y}
        x2={switchPoint.x}
        y2={switchPoint.y}
        stroke="black"
        strokeWidth="2"
      />
      
    
      <line
        x1={switchPoint.x}
        y1={endPoint.y}
        x2={endPoint.x}
        y2={endPoint.y}
        stroke="black"
        strokeWidth="2"
      />
      
      <circle cx={midPoint.x} cy={midPoint.y} r="3" fill="black" />
      <circle cx={endPoint.x} cy={endPoint.y} r="3" fill="black" />
    </g>
  );
};

export default Switch;