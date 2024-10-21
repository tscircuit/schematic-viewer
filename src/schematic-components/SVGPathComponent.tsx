import { useGlobalStore } from "lib/render-context";
import getSVGPathBounds from "lib/utils/get-svg-path-bounds";
import { useState } from "react";
import { applyToPoint, compose, scale, toSVG, translate } from "transformation-matrix";

interface PathProps {
  type?: 'path';
  strokeWidth: number;
  stroke: string;
  fill?: string;
  d: string;
}

interface CircleProps {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  strokeWidth: number;
  stroke: string;
  fill?: string;
}

export type SVGElement = PathProps | CircleProps;

interface Props {
  rotation: number;
  center: { x: number; y: number };
  size: { width: number; height: number };
  invertY?: boolean;
  shiftToBottom?: boolean;
  paths: SVGElement[];
  zIndex?: number;
  hoverContent?: any;
}

export const SVGPathComponent = ({
  size,
  center,
  rotation,
  paths,
  zIndex,
  invertY,
  shiftToBottom,
  hoverContent,
}: Props) => {
  const ct = useGlobalStore((s) => s.camera_transform);
  const pathBounds = getSVGPathBounds(paths.filter((p): p is PathProps => p.type !== 'circle').map(p => p.d));

  const padding = { x: 0, y: 0 };
  const absoluteCenter = applyToPoint(ct, center);
  const innerSize = {
    width: size.width * ct.a,
    height: size.height * Math.abs(ct.d),
  };
  const fullSize = {
    width: innerSize.width + padding.x * 2,
    height: innerSize.height + padding.y * 2,
  };

  const [hovering, setHovering] = useState(false);

  const svgLeft = absoluteCenter.x - fullSize.width / 2;
  const svgTop = absoluteCenter.y - fullSize.height / 2;

  const preferredRatio = pathBounds.width === 0
    ? innerSize.height / pathBounds.height
    : innerSize.width / pathBounds.width;

  const svgToScreen = compose(
    scale(
      pathBounds.width === 0 ? preferredRatio : fullSize.width / pathBounds.width,
      pathBounds.height === 0 ? preferredRatio : fullSize.height / pathBounds.height,
    ),
    translate(-pathBounds.minX, -pathBounds.minY),
  );

  return (
    <svg
      onMouseOver={() => setHovering(Boolean(hoverContent))}
      onMouseOut={() => setHovering(false)}
      style={{
        position: "absolute",
        cursor: hovering ? "pointer" : undefined,
        zIndex,
        transform: [
          invertY ? "scale(1, 1)" : "scale(1, -1)",
          shiftToBottom ? "translate(0, 100%)" : "",
          rotation === 0 ? "" : `rotate(${rotation}deg)`,
        ].join(" "),
        left: svgLeft,
        top: svgTop,
      }}
      overflow="visible"
      width={fullSize.width}
      height={fullSize.height}
    >
      {paths.map((p, i) => 
        p.type === 'circle' ? (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill={p.fill ?? "none"}
            strokeWidth={1.5 * (p.strokeWidth || 1)}
            stroke={p.stroke || "red"}
          />
        ) : (
          <path
            key={i}
            transform={toSVG(svgToScreen)}
            fill={p.fill ?? "none"}
            strokeLinecap="round"
            strokeWidth={1.5 * (p.strokeWidth || 1)}
            stroke={p.stroke || "red"}
            d={p.d || ""}
          />
        )
      )}
    </svg>
  );
};

export default SVGPathComponent;