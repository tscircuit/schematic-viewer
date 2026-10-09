import type { CircuitJson } from "circuit-json"
import importer from "@tscircuit/internal-dynamic-import/source"

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

export const styleAnalyzerLoader = {
  async load(): Promise<StyleAnalyzer> {
    const analyzer = await importer(
      "@tscircuit/circuit-json-schematic-placement-analysis",
    )
    if (typeof analyzer.createSchematicPlacementIssueArtifacts !== "function") {
      throw new Error(
        "The style analyzer module does not export its analysis function.",
      )
    }
    return analyzer
  },
}
