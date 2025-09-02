import { circuitJsonToSpice } from "circuit-json-to-spice"
import type { CircuitJson } from "circuit-json"

export interface SpiceSimOptions {
  showVoltage: boolean
  showCurrent: boolean
  startTime: number // in ms
  duration: number // in ms
}

const formatSimTime = (seconds: number): string => {
  if (seconds === 0) return "0"
  const absSeconds = Math.abs(seconds)

  const precision = (v: number) => v.toPrecision(4)

  if (absSeconds >= 1) return precision(seconds)
  if (absSeconds >= 1e-3) return `${precision(seconds * 1e3)}m`
  if (absSeconds >= 1e-6) return `${precision(seconds * 1e6)}u`
  if (absSeconds >= 1e-9) return `${precision(seconds * 1e9)}n`
  if (absSeconds >= 1e-12) return `${precision(seconds * 1e12)}p`
  if (absSeconds >= 1e-15) return `${precision(seconds * 1e15)}f`

  return seconds.toExponential(3)
}

export const getSpiceFromCircuitJson = (
  circuitJson: CircuitJson,
  options?: Partial<SpiceSimOptions>,
): string => {
  const spiceNetlist = circuitJsonToSpice(circuitJson as any)
  const baseSpiceString = spiceNetlist.toSpiceString()

  const lines = baseSpiceString.split("\n").filter((l) => l.trim() !== "")
  const componentLines = lines.filter(
    (l) => !l.startsWith("*") && !l.startsWith(".") && l.trim() !== "",
  )

  const allNodes = new Set<string>()
  const capacitorNodes = new Set<string>()
  const componentNamesToProbeCurrent = new Set<string>()

  for (const line of componentLines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 3) continue

    const componentName = parts[0]
    const componentType = componentName[0].toUpperCase()
    let nodesOnLine: string[] = []

    if (["R", "C", "L", "V", "I", "D"].includes(componentType)) {
      nodesOnLine = parts.slice(1, 3)
      // Only probe current on voltage sources
      if (componentType === "V") {
        componentNamesToProbeCurrent.add(componentName)
      }
    } else if (componentType === "Q" && parts.length >= 4) {
      // BJT
      nodesOnLine = parts.slice(1, 4)
    } else if (componentType === "M" && parts.length >= 5) {
      // MOSFET
      nodesOnLine = parts.slice(1, 5)
    } else if (componentType === "X") {
      // Subcircuit
      // Assume last part is model name, everything in between is a node
      nodesOnLine = parts.slice(1, -1)
    } else {
      continue
    }

    nodesOnLine.forEach((node) => allNodes.add(node))

    if (componentType === "C") {
      nodesOnLine.forEach((node) => capacitorNodes.add(node))
    }
  }

  // Do not probe/set IC for ground
  allNodes.delete("0")
  capacitorNodes.delete("0")

  const icLines = Array.from(capacitorNodes).map((node) => `.ic V(${node})=0`)

  const probes: string[] = []
  const probeVoltages = Array.from(allNodes).map((node) => `V(${node})`)
  probes.push(...probeVoltages)
  const probeCurrents = Array.from(componentNamesToProbeCurrent).map(
    (name) => `I(${name})`,
  )
  probes.push(...probeCurrents)

  const probeLine = probes.length > 0 ? `.probe ${probes.join(" ")}` : ""

  const tstart_ms = options?.startTime ?? 0
  const duration_ms = options?.duration ?? 20
  const tstart = tstart_ms * 1e-3 // s
  const duration = duration_ms * 1e-3 // s

  const tstop = tstart + duration
  const tstep = duration / 50
  const tranLine = `.tran ${formatSimTime(tstep)} ${formatSimTime(
    tstop,
  )} ${formatSimTime(tstart)} UIC`

  const endStatement = ".end"
  const originalLines = baseSpiceString.split("\n")
  let endIndex = -1
  for (let i = originalLines.length - 1; i >= 0; i--) {
    if (originalLines[i].trim().toLowerCase().startsWith(endStatement)) {
      endIndex = i
      break
    }
  }

  const injectionLines = [...icLines, probeLine, tranLine].filter(Boolean)

  let finalLines: string[]

  if (endIndex !== -1) {
    const beforeEnd = originalLines.slice(0, endIndex)
    const endLineAndAfter = originalLines.slice(endIndex)
    finalLines = [...beforeEnd, ...injectionLines, ...endLineAndAfter]
  } else {
    finalLines = [...originalLines, ...injectionLines, endStatement]
  }

  return finalLines.join("\n")
}
