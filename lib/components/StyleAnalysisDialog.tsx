import * as Dialog from "@radix-ui/react-dialog"
import {
  styleAnalyzerLoader,
  type StyleAnalysisArtifact,
} from "../utils/load-style-analyzer"
import type { CircuitJson } from "circuit-json"
import { useEffect, useState } from "react"
import { zIndexMap } from "../utils/z-index-map"

type AnalysisState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "complete"; artifacts: StyleAnalysisArtifact[] }

export const StyleAnalysisDialog = ({
  circuitJson,
  onClose,
}: {
  circuitJson: CircuitJson
  onClose: () => void
}) => {
  const [state, setState] = useState<AnalysisState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    // Let the dialog paint before loading and running the analyzer.
    const timer = window.setTimeout(async () => {
      try {
        const { createSchematicPlacementIssueArtifacts } =
          await styleAnalyzerLoader.load()
        if (cancelled) return
        const artifacts = createSchematicPlacementIssueArtifacts(circuitJson)
        if (!cancelled) setState({ status: "complete", artifacts })
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [circuitJson])

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "#0008",
            zIndex: zIndexMap.styleAnalysis,
          }}
        />
        <Dialog.Content
          style={{
            position: "fixed",
            top: "5vh",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(1000px, 94vw)",
            maxHeight: "90vh",
            overflowY: "auto",
            boxSizing: "border-box",
            padding: 24,
            borderRadius: 12,
            background: "#fafafa",
            color: "#171717",
            fontFamily: "system-ui, sans-serif",
            boxShadow: "0 20px 60px #0005",
            zIndex: zIndexMap.styleAnalysis,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <Dialog.Title style={{ margin: 0, fontSize: 22 }}>
              Style Analysis
            </Dialog.Title>
            <Dialog.Close style={{ cursor: "pointer", padding: "6px 12px" }}>
              Close
            </Dialog.Close>
          </div>
          <Dialog.Description style={{ color: "#525252" }}>
            Placement and style issues across all schematic sheets. Each image
            highlights one issue with its description below.
          </Dialog.Description>
          {state.status === "loading" && (
            <p role="status">Running style analysis…</p>
          )}
          {state.status === "error" && (
            <p role="alert">Style analysis failed: {state.message}</p>
          )}
          {state.status === "complete" && (
            <>
              <p role="status">
                {state.artifacts.length === 0
                  ? "No style issues found."
                  : `${state.artifacts.length} style ${state.artifacts.length === 1 ? "issue" : "issues"} found.`}
              </p>
              {state.artifacts.map((artifact) => (
                <section
                  key={artifact.issueIndex}
                  style={{
                    marginTop: 24,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "white",
                  }}
                >
                  <h3 style={{ margin: 16, fontSize: 16 }}>
                    {artifact.issueIndex + 1}.{" "}
                    {artifact.issue.lineItemType.replace(
                      /([a-z])([A-Z])/g,
                      "$1 $2",
                    )}
                    {artifact.schematicSheetId && (
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "#525252",
                        }}
                      >
                        Sheet: {artifact.schematicSheetId}
                      </small>
                    )}
                  </h3>
                  <img
                    src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(artifact.content)}`}
                    alt={artifact.descriptionXml}
                    loading="lazy"
                    style={{ display: "block", width: "100%", height: "auto" }}
                  />
                </section>
              ))}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
