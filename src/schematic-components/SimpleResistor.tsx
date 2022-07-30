import SVGPathComponent from "./SVGPathComponent"

export const SimpleResistor = () => {
  return (
    <SVGPathComponent
      size={{ width: 50, height: 50 }}
      paths={[
        {
          stroke: "red",
          strokeWidth: 1,
          d: "M 0 15 l 10 0 l 0 -6 l 20 0 l 0 12 l -20 0 l 0 -6 m 20 0 l 10 0",
        },
      ]}
    />
  )
}

export default SimpleResistor
