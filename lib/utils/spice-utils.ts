import { circuitJsonToSpice } from "circuit-json-to-spice"
import type { CircuitJson } from "circuit-json"

export const getSpiceFromCircuitJson = (circuitJson: CircuitJson): string => {
  const spiceNetlist = circuitJsonToSpice(circuitJson as any)
  const rawSpice = spiceNetlist.toSpiceString()

  const lines = rawSpice.split("\n").filter((l) => l.trim() !== "")

  const headerLines: string[] = []
  const componentLines: string[] = []
  const controlLines: string[] = []

  for (const line of lines) {
    const l = line.trim()
    if (/^[rRcCvVlLdDiIqQmMxX]/.test(l)) {
      componentLines.push(line)
    } else if (l.startsWith(".")) {
      controlLines.push(line)
    } else {
      headerLines.push(line)
    }
  }

  componentLines.sort()
  controlLines.sort()

  // .end should be last if it exists
  const endLineIndex = controlLines.findIndex((l) =>
    l.trim().toLowerCase().startsWith(".end"),
  )
  let endLine: string | undefined
  if (endLineIndex > -1) {
    endLine = controlLines.splice(endLineIndex, 1)[0]
  }

  const sortedLines = [...headerLines, ...componentLines, ...controlLines]
  if (endLine) {
    sortedLines.push(endLine)
  }

  const result = sortedLines.join("\n")

  console.log(spiceNetlist)
  console.log(result)
  return result
}

export const extractNodeNamesFromSpice = (spiceString: string): string[] => {
  const nodeNames = new Set<string>()
  const lines = spiceString.split("\n")

  for (const line of lines) {
    const trimmedLine = line.trim()
    // Basic regex for component lines (e.g., R1 N1 N2 1k)
    if (/^[rRcCvVlLdDiI]/.test(trimmedLine)) {
      const parts = trimmedLine.split(/\s+/)
      if (parts.length >= 3) {
        // nodes are typically the 2nd and 3rd part
        const node1 = parts[1]
        const node2 = parts[2]
        if (node1 && node1 !== "0") nodeNames.add(node1)
        if (node2 && node2 !== "0") nodeNames.add(node2)
      }
    }
  }

  return Array.from(nodeNames)
}
