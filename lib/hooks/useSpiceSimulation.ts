import { useState, useEffect } from "react"
import type * as EecircuitEngine from "../types/eecircuit-engine"
// @ts-ignore
import { getSpiceSimulationWorkerBlobUrl } from "../../scripts/build-worker-blob-url"

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

export interface PlotPoint {
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
  const plotableNodes = probedVariables

  const plotData: PlotPoint[] = timeValues.map((t: number, i: number) => {
    const point: PlotPoint = { name: t.toExponential(2) }
    probedVariables.forEach((variable) => {
      point[variable] = columnData[variable][i]
    })
    return point
  })

  return { plotData, nodes: plotableNodes }
}

type WorkerMessage =
  | {
      type: "result"
      result: EecEngineResult
    }
  | { type: "error"; error: string }

export const useSpiceSimulation = (spiceString: string | null) => {
  const [plotData, setPlotData] = useState<PlotPoint[]>([])
  const [nodes, setNodes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!spiceString) {
      setIsLoading(false)
      setPlotData([])
      setNodes([])
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    setPlotData([])
    setNodes([])

    const workerUrl = getSpiceSimulationWorkerBlobUrl()

    if (!workerUrl) {
      setError("Could not create SPICE simulation worker.")
      setIsLoading(false)
      return
    }

    const worker = new Worker(workerUrl, { type: "module" })

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      if (event.data.type === "result") {
        try {
          const { plotData: parsedData, nodes: parsedNodes } =
            parseEecEngineOutput(event.data.result)
          setPlotData(parsedData)
          setNodes(parsedNodes)
        } catch (e: any) {
          setError(e.message || "Failed to parse simulation result")
          console.error(e)
        }
      } else if (event.data.type === "error") {
        setError(event.data.error)
      }
      setIsLoading(false)
    }

    worker.onerror = (err) => {
      setError(err.message)
      setIsLoading(false)
    }

    worker.postMessage({ spiceString })

    return () => {
      worker.terminate()
    }
  }, [spiceString])

  return { plotData, nodes, isLoading, error }
}
