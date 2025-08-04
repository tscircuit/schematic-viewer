import { useState, useEffect } from "react"
import type * as EecircuitEngine from "../types/eecircuit-engine"

// Types from eecircuit-engine interface
type RealDataType = {
  name: string
  type: string
  values: number[]
}
type ComplexNumber = {
  real: number
  img: number
}
type ComplexDataType = {
  name: string
  type: string
  values: ComplexNumber[]
}
type EecEngineResult =
  | {
      header: string
      numVariables: number
      variableNames: string[]
      numPoints: number
      dataType: "real"
      data: RealDataType[]
    }
  | {
      header: string
      numVariables: number
      variableNames: string[]
      numPoints: number
      dataType: "complex"
      data: ComplexDataType[]
    }

const fetchSimulation = async (): Promise<
  typeof EecircuitEngine.Simulation
> => {
  const module = await import(
    // @ts-ignore
    "https://cdn.jsdelivr.net/npm/eecircuit-engine@1.5.2/+esm"
  )
  return module.Simulation as typeof EecircuitEngine.Simulation
}

interface PlotPoint {
  name: string // time or sweep variable
  [key: string]: number | string
}

const parseEecEngineOutput = (
  result: EecEngineResult,
): { plotData: PlotPoint[]; nodes: string[] } => {
  const columnData: Record<string, number[]> = {}

  if (result.dataType === "real") {
    result.data.forEach((col) => {
      columnData[col.name] = col.values
    })
  } else if (result.dataType === "complex") {
    result.data.forEach((col) => {
      // For now, plot the real part of complex numbers
      columnData[col.name] = col.values.map((v) => v.real)
    })
  } else {
    throw new Error("Unsupported data type in simulation result")
  }

  const timeKey = Object.keys(columnData).find(
    (k) => k.toLowerCase() === "time" || k.toLowerCase() === "frequency",
  )
  if (!timeKey) {
    throw new Error("No time or frequency data in simulation result")
  }
  const timeValues = columnData[timeKey]
  const probedVariables = Object.keys(columnData).filter((k) => k !== timeKey)
  const plotableNodes = probedVariables.map((n) =>
    n.replace(/v\(([^)]+)\)/i, "$1"),
  )

  const plotData: PlotPoint[] = timeValues.map((t: number, i: number) => {
    const point: PlotPoint = { name: t.toExponential(2) }
    probedVariables.forEach((variable, j) => {
      point[plotableNodes[j]] = columnData[variable][i]
    })
    return point
  })

  return { plotData, nodes: plotableNodes }
}

export const useSpiceSimulation = (spiceString: string) => {
  const [plotData, setPlotData] = useState<PlotPoint[]>([])
  const [nodes, setNodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const runSimulation = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setPlotData([])
        setNodes([])

        const Simulation = await fetchSimulation()
        const sim = new Simulation()
        await sim.start()

        let engineSpiceString = spiceString
        const wrdataMatch = spiceString.match(/wrdata\s+(\S+)\s+(.*)/i)
        if (wrdataMatch) {
          const variables = wrdataMatch[2].trim().split(/\s+/)
          const probeLine = `.probe ${variables.join(" ")}`
          engineSpiceString = spiceString.replace(/wrdata.*/i, probeLine)
        } else if (!spiceString.match(/\.probe/i)) {
          const plotMatch = spiceString.match(/plot\s+(.*)/i)
          if (plotMatch) {
            throw new Error(
              "The 'plot' command is not supported for data extraction. Please use 'wrdata <filename> <var1> ...' or '.probe <var1> ...' instead.",
            )
          }
          throw new Error(
            "No '.probe' or 'wrdata' command found in SPICE file. Use 'wrdata <filename> <var1> ...' to specify output.",
          )
        }

        sim.setNetList(engineSpiceString)
        const result = await sim.runSim()

        const { plotData: parsedData, nodes: parsedNodes } =
          parseEecEngineOutput(result)
        setPlotData(parsedData)
        setNodes(parsedNodes)
      } catch (e: any) {
        setError(e.message || "Failed to run simulation")
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    runSimulation()
  }, [spiceString])

  return { plotData, nodes, isLoading, error }
}
