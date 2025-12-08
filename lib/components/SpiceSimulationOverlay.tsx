import type { PlotPoint } from "../hooks/useSpiceSimulation"
import { lazy, Suspense, useEffect, useState } from "react"
import { zIndexMap } from "../utils/z-index-map"

const SpicePlot = lazy(async () => {
  const mod = await import("./SpicePlot")
  return { default: mod.SpicePlot }
})

interface SpiceSimulationOverlayProps {
  spiceString: string | null
  onClose: () => void
  plotData: PlotPoint[]
  nodes: string[]
  isLoading: boolean
  error: string | null
  simOptions: {
    showVoltage: boolean
    showCurrent: boolean
    startTime: number
    duration: number
  }
  onSimOptionsChange: (
    options: SpiceSimulationOverlayProps["simOptions"],
  ) => void
  hasRun: boolean
}

export const SpiceSimulationOverlay = ({
  spiceString,
  onClose,
  plotData,
  nodes,
  isLoading,
  error,
  simOptions,
  onSimOptionsChange,
  hasRun,
}: SpiceSimulationOverlayProps) => {
  const [startTimeDraft, setStartTimeDraft] = useState(
    String(simOptions.startTime),
  )
  const [durationDraft, setDurationDraft] = useState(
    String(simOptions.duration),
  )

  useEffect(() => {
    setStartTimeDraft(String(simOptions.startTime))
    setDurationDraft(String(simOptions.duration))
  }, [simOptions.startTime, simOptions.duration])

  const handleRerun = () => {
    onSimOptionsChange({
      ...simOptions,
      startTime: Number(startTimeDraft),
      duration: Number(durationDraft),
    })
  }

  const filteredNodes = nodes.filter((node) => {
    const isVoltage = node.toLowerCase().startsWith("v(")
    const isCurrent = node.toLowerCase().startsWith("i(")
    if (simOptions.showVoltage && isVoltage) return true
    if (simOptions.showCurrent && isCurrent) return true
    return false
  })

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndexMap.spiceSimulationOverlay,
        fontFamily: "sans-serif",
        touchAction: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "900px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            borderBottom: "1px solid #eee",
            paddingBottom: "16px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 600,
              color: "#333",
            }}
          >
            SPICE Simulation
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "28px",
              cursor: "pointer",
              color: "#888",
              padding: 0,
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
        <div>
          <Suspense
            fallback={
              <div
                style={{
                  height: "320px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                Loading plot…
              </div>
            }
          >
            <SpicePlot
              plotData={plotData}
              nodes={filteredNodes}
              isLoading={isLoading}
              error={error}
              hasRun={hasRun}
            />
          </Suspense>
        </div>
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f7f7f7",
            borderRadius: "6px",
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            alignItems: "center",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", gap: "16px" }}>
            <label
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <input
                type="checkbox"
                checked={simOptions.showVoltage}
                onChange={(e) =>
                  onSimOptionsChange({
                    ...simOptions,
                    showVoltage: e.target.checked,
                  })
                }
              />
              Voltage
            </label>
            <label
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <input
                type="checkbox"
                checked={simOptions.showCurrent}
                onChange={(e) =>
                  onSimOptionsChange({
                    ...simOptions,
                    showCurrent: e.target.checked,
                  })
                }
              />
              Current
            </label>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <label htmlFor="startTime">Start Time (ms):</label>
            <input
              id="startTime"
              type="number"
              value={startTimeDraft}
              onChange={(e) => setStartTimeDraft(e.target.value)}
              style={{
                width: "80px",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <label htmlFor="duration">Duration (ms):</label>
            <input
              id="duration"
              type="number"
              value={durationDraft}
              onChange={(e) => setDurationDraft(e.target.value)}
              style={{
                width: "80px",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={handleRerun}
              style={{
                padding: "4px 12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#f0f0f0",
                cursor: "pointer",
              }}
            >
              {hasRun ? "Rerun" : "Run"}
            </button>
          </div>
        </div>
        <div style={{ marginTop: "24px" }}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: "12px",
              fontSize: "18px",
              fontWeight: 600,
              color: "#333",
            }}
          >
            SPICE Netlist
          </h3>
          <pre
            style={{
              backgroundColor: "#fafafa",
              padding: "16px",
              borderRadius: "6px",
              maxHeight: "150px",
              overflowY: "auto",
              border: "1px solid #eee",
              color: "#333",
              fontSize: "13px",
              fontFamily: "monospace",
            }}
          >
            {spiceString}
          </pre>
        </div>
      </div>
    </div>
  )
}
