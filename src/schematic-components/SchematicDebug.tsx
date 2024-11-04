import type React from "react"
import SVGPathComponent from "./SVGPathComponent"
import Path from "svg-path-generator"

interface Props {
  debugObject: {
    shape: "rect" | "line"
    center?: { x: number; y: number }
    size?: { width: number; height: number }
    start?: { x: number; y: number }
    end?: { x: number; y: number }
    label?: string
    type: string
  }
}

export const SchematicDebug: React.FC<Props> = ({ debugObject }) => {
  if (!debugObject) return null;

  // Fixed size for debug squares
  const debugSquareSize = { width: 0.1, height: 0.1 };

  if (debugObject.shape === "rect" && debugObject.center) {
    const { center } = debugObject;

    console.log("center - debug", center)
    
    // Draw centered debug square at the absolute position
    const path = Path();
    path
      .moveTo(
        -debugSquareSize.width / 2,
        -debugSquareSize.height / 2
      )
      .lineTo(
        debugSquareSize.width / 2,
        -debugSquareSize.height / 2
      )
      .lineTo(
        debugSquareSize.width / 2,
        debugSquareSize.height / 2
      )
      .lineTo(
        -debugSquareSize.width / 2,
        debugSquareSize.height / 2
      )
      .close();

    const paths = [
      {
        stroke: "red",
        strokeWidth: 0.01,
        strokeDasharray: "5,5",
        fill: "none",
        d: path.toString(),
      },
    ];

    return (
      <SVGPathComponent
        rotation={0}
        center={center} // Use absolute position directly
        size={debugSquareSize}
        paths={paths}
      />
    );
  }

  if (debugObject.shape === "line" && debugObject.start && debugObject.end) {
    const { start, end } = debugObject;
    const path = Path();

    // Draw line from start to end
    path.moveTo(0, 0)
        .lineTo(end.x - start.x, end.y - start.y);


    const size = {
      width: Math.abs(end.x - start.x) || 0.1,
      height: Math.abs(end.y - start.y) || 0.1
    };

    const paths = [
      {
        stroke: "red",
        strokeWidth: 0.02,
        strokeDasharray: "5,5",
        d: path.toString(),
      },
    ];

    return (
      <SVGPathComponent
        rotation={0}
        center={start}
        size={size}
        paths={paths}
      />
    );
  }

  return null;
};

export default SchematicDebug;