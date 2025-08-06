import { circuitJsonToSpice } from "circuit-json-to-spice"
import type { CircuitJson } from "circuit-json"

export const getSpiceFromCircuitJson = (circuitJson: CircuitJson): string => {
  const spiceNetlist = circuitJsonToSpice(circuitJson as any)
  const baseSpiceString = spiceNetlist.toSpiceString()

  const lines = baseSpiceString.split("\n").filter((l) => l.trim() !== "")
  const componentLines = lines.filter(
    (l) => !l.startsWith("*") && !l.startsWith(".") && l.trim() !== "",
  )

  const allNodes = new Set<string>()
  const capacitorNodes = new Set<string>()

  for (const line of componentLines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 3) continue

    const componentType = parts[0][0].toUpperCase()
    let nodesOnLine: string[] = []

    if (["R", "C", "L", "V", "I", "D"].includes(componentType)) {
      nodesOnLine = parts.slice(1, 3)
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

  const probeNodes = Array.from(allNodes).map((node) => `V(${node})`)
  const probeLine =
    probeNodes.length > 0 ? `.probe ${probeNodes.join(" ")}` : ""

  const tranLine = ".tran 0.1ms 50ms UIC"

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
