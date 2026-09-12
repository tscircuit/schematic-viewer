import type { CircuitJson } from "circuit-json"

export interface StyleAnalysisArtifact {
  issueIndex: number
  issue: { lineItemType: string }
  schematicSheetId?: string
  descriptionXml: string
  content: string
}

export interface StyleAnalyzer {
  createSchematicPlacementIssueArtifacts: (
    circuitJson: CircuitJson,
  ) => StyleAnalysisArtifact[]
}

export const STYLE_ANALYZER_URL =
  "https://jscdn.tscircuit.com/@tscircuit/circuit-json-schematic-placement-analysis/latest/dist/browser.js"

export const styleAnalyzerLoader = {
  async load(): Promise<StyleAnalyzer> {
    // Leave this URL import to the browser, including in downstream Vite/Webpack apps.
    const analyzer = await import(
      /* @vite-ignore */ /* webpackIgnore: true */ STYLE_ANALYZER_URL
    )
    if (typeof analyzer.createSchematicPlacementIssueArtifacts !== "function") {
      throw new Error(
        "The style analyzer module does not export its analysis function.",
      )
    }
    return analyzer
  },
}
