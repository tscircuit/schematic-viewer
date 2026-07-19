import { colorMap, type ColorOverrides } from "circuit-to-svg"

const getCssDeclarationValue = (declarations: string, property: string) => {
  const match = declarations.match(
    new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, "i"),
  )
  return match?.[1]?.trim()
}

const getRootSvgBackgroundColor = (simulationSvg: string) => {
  const rootStyleMatch = simulationSvg.match(
    /<svg\b[^>]*\bstyle=(?:"([^"]*)"|'([^']*)')/i,
  )
  const rootStyle = rootStyleMatch?.[1] ?? rootStyleMatch?.[2]
  return rootStyle
    ? getCssDeclarationValue(rootStyle, "background-color")
    : undefined
}

const getGraphBackgroundColor = (simulationSvg: string) => {
  const backgroundRule = simulationSvg.match(/\.background\s*\{([^}]*)\}/i)?.[1]
  return backgroundRule
    ? getCssDeclarationValue(backgroundRule, "fill")
    : undefined
}

export const getAnalogSimulationBackgroundColor = (
  simulationSvg: string,
  colorOverrides?: ColorOverrides,
) =>
  getRootSvgBackgroundColor(simulationSvg) ??
  getGraphBackgroundColor(simulationSvg) ??
  colorOverrides?.schematic?.background ??
  colorMap.schematic.background
