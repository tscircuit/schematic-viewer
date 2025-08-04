import type { CircuitJson } from "circuit-json"
import { useMemo } from "react"
import { getSpiceFromCircuitJson } from "../utils/spice-utils"
import { SpicePlot } from "./SpicePlot"

interface SpiceSimulationOverlayProps {
  circuitSource: CircuitJson | string
  onClose: () => void
}

export const SpiceSimulationOverlay = ({
  circuitSource,
  onClose,
}: SpiceSimulationOverlayProps) => {
  const spiceString = useMemo(() => {
    if (typeof circuitSource === "string") {
      return circuitSource
    }
    return getSpiceFromCircuitJson(circuitSource)
  }, [circuitSource])

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
        zIndex: 1002,
        fontFamily: "sans-serif",
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
          <SpicePlot spiceString={spiceString} />
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
              paddingLeft: "16px",
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
