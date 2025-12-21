import {
  convertCircuitJsonToSchematicSimulationSvg,
  type ColorOverrides,
} from "circuit-to-svg"
import { useEffect, useState, useMemo, useRef } from "react"
import { useResizeHandling } from "../hooks/use-resize-handling"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { toString as transformToString } from "transformation-matrix"
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
  const imgRef = useRef<HTMLImageElement>(null)

  const { containerWidth, containerHeight } = useResizeHandling(
    containerRef as React.RefObject<HTMLElement>,
  )

  const [isDragging, setIsDragging] = useState(false)

  const {
    ref: transformRef,
    cancelDrag: _cancelDrag,
    transform: _svgToScreenProjection,
  } = useMouseMatrixTransform({
    onSetTransform(transform) {
      if (imgRef.current) {
        imgRef.current.style.transform = transformToString(transform)
      }
    },
  })

  const effectiveWidth = width || containerWidth || 1000
  const effectiveHeight = height || containerHeight || 600

  // Set CircuitJSON from props
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setCircuitJson(inputCircuitJson)
    setIsLoading(false)
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
    if (
      !circuitJson ||
      !effectiveWidth ||
      !effectiveHeight ||
      !simulationExperimentId
    )
      return ""

    try {
      return convertCircuitJsonToSchematicSimulationSvg({
        circuitJson,
        simulation_experiment_id: simulationExperimentId,
        simulation_transient_voltage_graph_ids: simulationGraphIds,
        width: effectiveWidth,
        height: effectiveHeight,
        schematicOptions: { colorOverrides },
      })
    } catch (fallbackErr) {
      console.error("Failed to generate fallback schematic SVG:", fallbackErr)
      return ""
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
    }
  }, [simulationSvg])

  const containerBackgroundColor = useMemo(() => {
    if (!simulationSvg) return "transparent"
    const match = simulationSvg.match(
      /<svg[^>]*style="[^"]*background-color:\s*([^;\"]+)/i,
    )
    return match?.[1] ?? "transparent"
  }, [simulationSvg])

  const handleMouseDown = (_e: React.MouseEvent) => {
    setIsDragging(true)
  }

  const handleTouchStart = (_e: React.TouchEvent) => {
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          minHeight: "300px",
          fontFamily: "sans-serif",
          gap: "12px",
          ...containerStyle,
        }}
        className={className}
      >
        <div style={{ fontSize: "16px", color: "#475569", fontWeight: 500 }}>
          No Simulation Found
        </div>
        <div style={{ fontSize: "14px", color: "#64748b" }}>
          Use{" "}
          <code
            style={{
              backgroundColor: "#e2e8f0",
              padding: "2px 6px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "13px",
            }}
          >
            {"<analogsimulation />"}
          </code>{" "}
          to create simulations
        </div>
      </div>
    )
  }

  return (
    <div
      ref={(node) => {
        containerRef.current = node
        transformRef.current = node
      }}
      style={{
        position: "relative",
        backgroundColor: containerBackgroundColor,
        overflow: "hidden",
        minHeight: "300px",
        cursor: isDragging ? "grabbing" : "grab",
        ...containerStyle,
      }}
      className={className}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {svgObjectUrl ? (
        <img
          ref={imgRef}
          src={svgObjectUrl}
          alt="Circuit Simulation"
          style={{
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "contain",
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
