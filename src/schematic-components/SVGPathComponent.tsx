interface Props {
  size: { width: number; height: number }
  paths: Array<{
    strokeWidth: number
    stroke: string
    d: string
  }>
}

export const SVGPathComponent = ({ size, paths }: Props) => {
  return (
    <svg width={size.width} height={size.height}>
      {paths.map((p, i) => (
        <path
          key={i}
          fill="none"
          strokeWidth={2 * (p.strokeWidth || 1)}
          stroke={p.stroke || "red"}
          d={p.d}
        />
      ))}
    </svg>
  )
}

export default SVGPathComponent
