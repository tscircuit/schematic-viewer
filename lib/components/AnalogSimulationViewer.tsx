import {
  convertCircuitJsonToSimulationGraphSvg,
  convertCircuitJsonToSchematicSvg,
  type ColorOverrides,
} from "circuit-to-svg"
import { useEffect, useState, useMemo, useRef } from "react"
import { useResizeHandling } from "../hooks/use-resize-handling"
import type { CircuitJson } from "circuit-json"

interface Props {
  circuitJson: CircuitJson
  containerStyle?: React.CSSProperties
  colorOverrides?: ColorOverrides
  width?: number
  height?: number
  className?: string
}

export const AnalogSimulationViewer = ({
  circuitJson: inputCircuitJson,
  containerStyle,
  colorOverrides,
  width,
  height,
  className,
}: Props) => {
  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [svgObjectUrl, setSvgObjectUrl] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { containerWidth, containerHeight } = useResizeHandling(
    containerRef as any,
  )

  const effectiveWidth = width || containerWidth || 1000
  const effectiveHeight = height || containerHeight || 600

  // Set CircuitJSON from props
  useEffect(() => {
    try {
      setIsLoading(true)
      setError(null)
      setCircuitJson(inputCircuitJson)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process CircuitJSON",
      )
      setCircuitJson(null)
    } finally {
      setIsLoading(false)
    }
  }, [inputCircuitJson])

  // Find simulation experiment ID from circuit JSON
  const simulationExperimentId = useMemo(() => {
    if (!circuitJson) return null
    const simulationElement = circuitJson.find(
      (el) => el.type === "simulation_experiment",
    )
    return simulationElement?.simulation_experiment_id || null
  }, [circuitJson])

  // Find simulation graph IDs from circuit JSON
  const simulationGraphIds = useMemo(() => {
    if (!circuitJson) return []
    return circuitJson
      .filter((el) => el.type === "simulation_transient_voltage_graph")
      .map((el) => el.simulation_transient_voltage_graph_id)
  }, [circuitJson])

  // Generate SVG from CircuitJSON
  const simulationSvg = useMemo(() => {
    if (!circuitJson || !effectiveWidth || !effectiveHeight) return ""

    try {
      // Try to generate simulation SVG if we have simulation data
      if (simulationExperimentId) {
        return convertCircuitJsonToSimulationGraphSvg({
          circuitJson,
          simulation_experiment_id: simulationExperimentId,
          simulation_transient_voltage_graph_ids: simulationGraphIds,
          width: effectiveWidth,
          height: effectiveHeight,
        })
      } else {
        // Fallback to schematic SVG if no simulation data
        return convertCircuitJsonToSchematicSvg(circuitJson as any, {
          width: effectiveWidth,
          height: effectiveHeight,
          colorOverrides,
        })
      }
    } catch (err) {
      console.error("Failed to generate SVG:", err)
      // Fallback to schematic SVG if simulation SVG fails
      try {
        return convertCircuitJsonToSchematicSvg(circuitJson, {
          width: effectiveWidth,
          height: effectiveHeight,
          colorOverrides,
        })
      } catch (fallbackErr) {
        console.error("Failed to generate fallback schematic SVG:", fallbackErr)
        return ""
      }
    }
  }, [
    circuitJson,
    effectiveWidth,
    effectiveHeight,
    colorOverrides,
    simulationExperimentId,
    simulationGraphIds,
  ])

  // Create/revoke object URL whenever the SVG changes
  useEffect(() => {
    if (!simulationSvg) {
      setSvgObjectUrl(null)
      return
    }

    try {
      const blob = new Blob([simulationSvg], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      setSvgObjectUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Failed to create SVG object URL:", error)
      setSvgObjectUrl(null)
      return
    }
  }, [simulationSvg])

  const containerBackgroundColor = useMemo(() => {
    if (!simulationSvg) return "transparent"
    const match = simulationSvg.match(
      /<svg[^>]*style="[^"]*background-color:\s*([^;\"]+)/i,
    )
    return match?.[1] ?? "transparent"
  }, [simulationSvg])

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          minHeight: "300px",
          fontFamily: "sans-serif",
          fontSize: "16px",
          color: "#666",
          ...containerStyle,
        }}
        className={className}
      >
        Loading circuit...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fef2f2",
          minHeight: "300px",
          fontFamily: "sans-serif",
          fontSize: "16px",
          color: "#dc2626",
          border: "1px solid #fecaca",
          borderRadius: "4px",
          ...containerStyle,
        }}
        className={className}
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            Circuit Conversion Error
          </div>
          <div style={{ fontSize: "14px" }}>{error}</div>
        </div>
      </div>
    )
  }

  if (!simulationSvg) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fef2f2",
          minHeight: "300px",
          fontFamily: "sans-serif",
          fontSize: "16px",
          color: "#dc2626",
          ...containerStyle,
        }}
        className={className}
      >
        Failed to generate simulation SVG
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        backgroundColor: containerBackgroundColor,
        overflow: "hidden",
        width: effectiveWidth,
        height: effectiveHeight,
        ...containerStyle,
      }}
      className={className}
    >
      {svgObjectUrl ? (
        <img
          src={svgObjectUrl}
          alt="Circuit Simulation"
          style={{
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "contain",
            maxWidth: effectiveWidth,
            maxHeight: effectiveHeight,
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "300px",
            color: "#666",
            fontFamily: "sans-serif",
          }}
        >
          Failed to render SVG
        </div>
      )}
    </div>
  )
}
