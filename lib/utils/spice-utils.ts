import { circuitJsonToSpice } from "circuit-json-to-spice"
import type { CircuitJson } from "circuit-json"

export const getSpiceFromCircuitJson = (circuitJson: CircuitJson): string => {
  const spiceNetlist = circuitJsonToSpice(circuitJson as any)
  console.log(spiceNetlist)
  console.log(spiceNetlist.toSpiceString())
  return spiceNetlist.toSpiceString()
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
