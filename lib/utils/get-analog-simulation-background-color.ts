import { type ColorOverrides, colorMap } from "circuit-to-svg"

const getRootSvgBackgroundColor = (simulationSvg: string) => {
  const rootStyleMatch = simulationSvg.match(
    /<svg\b[^>]*\bstyle=(?:"([^"]*)"|'([^']*)')/i,
  )
  const rootStyle = rootStyleMatch?.[1] ?? rootStyleMatch?.[2]
  return rootStyle
    ?.match(/(?:^|;)\s*background-color\s*:\s*([^;]+)/i)?.[1]
    ?.trim()
}

const getGraphBackgroundColor = (simulationSvg: string) =>
  simulationSvg
    .match(/\.background\s*\{[^}]*\bfill\s*:\s*([^;}]+)/i)?.[1]
    ?.trim()

export const getAnalogSimulationBackgroundColor = (
  simulationSvg: string,
  colorOverrides?: ColorOverrides,
) =>
  getRootSvgBackgroundColor(simulationSvg) ??
  getGraphBackgroundColor(simulationSvg) ??
  colorOverrides?.schematic?.background ??
  colorMap.schematic.background
