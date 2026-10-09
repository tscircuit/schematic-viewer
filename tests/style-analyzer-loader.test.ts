import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { styleAnalyzerLoader } from "../lib/utils/load-style-analyzer"

test("style analysis uses the configured dynamic importer without online fallback", async () => {
  const previousResolver = Object.getOwnPropertyDescriptor(
    globalThis,
    "tscircuitDynamicImportResolver",
  )
  const originalFetch = globalThis.fetch
  const imports: string[] = []
  const analyzed: CircuitJson[] = []
  const analyzer = {
    createSchematicPlacementIssueArtifacts(circuitJson: CircuitJson) {
      analyzed.push(circuitJson)
      return []
    },
  }
  Object.defineProperty(globalThis, "tscircuitDynamicImportResolver", {
    configurable: true,
    writable: true,
    value: (name: string) => {
      imports.push(name)
      if (name !== "@tscircuit/circuit-json-schematic-placement-analysis")
        throw new Error(`Unexpected module ${name}`)
      return analyzer
    },
  })
  globalThis.fetch = (() => {
    throw new Error("A configured importer must not fetch online")
  }) as unknown as typeof fetch
  try {
    const module = await styleAnalyzerLoader.load()
    const circuitJson: CircuitJson = []
    expect(module.createSchematicPlacementIssueArtifacts(circuitJson)).toEqual(
      [],
    )
    expect(imports).toEqual([
      "@tscircuit/circuit-json-schematic-placement-analysis",
    ])
    expect(analyzed).toEqual([circuitJson])
  } finally {
    globalThis.fetch = originalFetch
    if (previousResolver)
      Object.defineProperty(
        globalThis,
        "tscircuitDynamicImportResolver",
        previousResolver,
      )
    else Reflect.deleteProperty(globalThis, "tscircuitDynamicImportResolver")
  }
})
