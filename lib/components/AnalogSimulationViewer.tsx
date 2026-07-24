import type { CircuitJson } from "circuit-json"
import {
  type AcSweepView,
  type ColorOverrides,
  convertCircuitJsonToSchematicSimulationSvg,
  convertCircuitJsonToSimulationGraphSvg,
} from "circuit-to-svg"
import { useEffect, useMemo, useRef, useState } from "react"
import { toString as transformToString } from "transformation-matrix"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { useResizeHandling } from "../hooks/use-resize-handling"
import { getAnalogSimulationBackgroundColor } from "../utils/get-analog-simulation-background-color"
import { AnalogSimulationSelector } from "./AnalogSimulationSelector"

const DEFAULT_RENDER_WIDTH = 1200
const DEFAULT_COMBINED_RENDER_ASPECT_RATIO = 1
const DEFAULT_GRAPH_ONLY_RENDER_ASPECT_RATIO = 2

interface Props {
  circuitJson: CircuitJson
  containerStyle?: React.CSSProperties
  colorOverrides?: ColorOverrides
  width?: number
  height?: number
  className?: string
  /** Whether to hide the schematic and render only the simulation graph. Defaults to false. */
  hideSchematic?: boolean
  /** Called when the active simulation changes. */
  onSimulationChange?: (simulationExperimentId: string) => void
  /** Selects the AC result view. Defaults to magnitude. */
  acSweepView?: AcSweepView
}

export const AnalogSimulationViewer = ({
  circuitJson: inputCircuitJson,
  containerStyle,
  colorOverrides,
  width,
  height,
  className,
  hideSchematic = false,
  onSimulationChange,
  acSweepView = "magnitude",
}: Props) => {
  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [svgObjectUrl, setSvgObjectUrl] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const { containerWidth } = useResizeHandling(
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

  const defaultRenderAspectRatio = hideSchematic
    ? DEFAULT_GRAPH_ONLY_RENDER_ASPECT_RATIO
    : DEFAULT_COMBINED_RENDER_ASPECT_RATIO
  const renderAspectRatio =
    width && height ? width / height : defaultRenderAspectRatio
  const effectiveWidth =
    width ||
    (height ? height * renderAspectRatio : containerWidth) ||
    DEFAULT_RENDER_WIDTH
  const effectiveHeight = height || effectiveWidth / renderAspectRatio

  // Set CircuitJSON from props
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setCircuitJson(inputCircuitJson)
    setIsLoading(false)
  }, [inputCircuitJson])

  const simulationExperiments = useMemo(() => {
    if (!circuitJson) return []
    return circuitJson.filter(
      (element) => element.type === "simulation_experiment",
    )
  }, [circuitJson])
  const [selectedSimulationExperimentId, setSelectedSimulationExperimentId] =
    useState<string | null>(null)
  const simulationExperimentId =
    (selectedSimulationExperimentId &&
    simulationExperiments.some(
      (simulation) =>
        simulation.simulation_experiment_id === selectedSimulationExperimentId,
    )
      ? selectedSimulationExperimentId
      : simulationExperiments[0]?.simulation_experiment_id) ?? null

  useEffect(() => {
    if (simulationExperimentId !== selectedSimulationExperimentId) {
      setSelectedSimulationExperimentId(simulationExperimentId)
    }
  }, [simulationExperimentId, selectedSimulationExperimentId])

  const handleSelectSimulation = (nextSimulationExperimentId: string) => {
    setSelectedSimulationExperimentId(nextSimulationExperimentId)
    onSimulationChange?.(nextSimulationExperimentId)
  }

  // Generate the simulation SVG from CircuitJSON
  const simulationSvg = useMemo(() => {
    if (
      !circuitJson ||
      !effectiveWidth ||
      !effectiveHeight ||
      !simulationExperimentId
    )
      return ""

    try {
      const simulationOptions = {
        circuitJson,
        simulation_experiment_id: simulationExperimentId,
        ac_sweep_view: acSweepView,
        width: effectiveWidth,
        height: effectiveHeight,
      }

      return hideSchematic
        ? convertCircuitJsonToSimulationGraphSvg(simulationOptions)
        : convertCircuitJsonToSchematicSimulationSvg({
            ...simulationOptions,
            schematicOptions: { colorOverrides },
          })
    } catch (error) {
      console.error("Failed to generate simulation SVG:", error)
      return ""
    }
  }, [
    circuitJson,
    effectiveWidth,
    effectiveHeight,
    colorOverrides,
    hideSchematic,
    simulationExperimentId,
    acSweepView,
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
    return getAnalogSimulationBackgroundColor(simulationSvg, colorOverrides)
  }, [simulationSvg, colorOverrides])

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
      <AnalogSimulationSelector
        simulations={simulationExperiments}
        selectedSimulationExperimentId={simulationExperimentId}
        onSelectSimulation={handleSelectSimulation}
      />
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
