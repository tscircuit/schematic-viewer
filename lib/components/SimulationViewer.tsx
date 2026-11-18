import type { CircuitJson, SimulationEyeDiagram } from "circuit-json"
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
import { getSimulationBackgroundColor } from "../utils/get-simulation-background-color"
import { SimulationSelector } from "./SimulationSelector"
import { SimulationResultSelector } from "./SimulationResultSelector"

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

export const SimulationViewer = ({
  circuitJson,
  containerStyle,
  colorOverrides,
  width,
  height,
  className,
  hideSchematic = false,
  onSimulationChange,
  acSweepView = "magnitude",
}: Props) => {
  const [svgObjectUrl, setSvgObjectUrl] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const { containerWidth, containerHeight } = useResizeHandling(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [isDragging, setIsDragging] = useState(false)
  const { ref: transformRef } = useMouseMatrixTransform({
    onSetTransform(transform) {
      if (imgRef.current) {
        imgRef.current.style.transform = transformToString(transform)
      }
    },
  })

  const defaultRenderAspectRatio = hideSchematic
    ? DEFAULT_GRAPH_ONLY_RENDER_ASPECT_RATIO
    : DEFAULT_COMBINED_RENDER_ASPECT_RATIO
  const effectiveWidth =
    width ||
    (height ? height * defaultRenderAspectRatio : containerWidth) ||
    DEFAULT_RENDER_WIDTH
  const effectiveHeight =
    height ||
    (hideSchematic && !width && containerHeight
      ? containerHeight
      : effectiveWidth / defaultRenderAspectRatio)

  const simulationExperiments = useMemo(
    () =>
      circuitJson.filter((element) => element.type === "simulation_experiment"),
    [circuitJson],
  )
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
    setSelectedEyeDiagramId(undefined)
    onSimulationChange?.(nextSimulationExperimentId)
  }

  const eyes = useMemo(
    () =>
      circuitJson.filter(
        (element): element is SimulationEyeDiagram =>
          element.type === "simulation_eye_diagram" &&
          element.simulation_experiment_id === simulationExperimentId,
      ),
    [circuitJson, simulationExperimentId],
  )
  // A declared eye is the experiment's requested visualization. Waveforms remain selectable.
  const [selectedEyeDiagramId, setSelectedEyeDiagramId] = useState<
    string | null | undefined
  >()
  const activeEyeDiagramId =
    selectedEyeDiagramId === null
      ? null
      : (eyes.find(
          (eye) => eye.simulation_eye_diagram_id === selectedEyeDiagramId,
        )?.simulation_eye_diagram_id ??
        eyes[0]?.simulation_eye_diagram_id ??
        null)

  const { simulationSvg, renderError } = useMemo(() => {
    if (!simulationExperimentId) return { simulationSvg: "", renderError: null }

    try {
      const simulationOptions = {
        circuitJson,
        simulation_experiment_id: simulationExperimentId,
        simulation_eye_diagram_id: activeEyeDiagramId ?? undefined,
        ac_sweep_view: acSweepView,
        time_unit: "auto" as const,
        width: effectiveWidth,
        height: effectiveHeight,
      }
      return {
        simulationSvg: hideSchematic
          ? convertCircuitJsonToSimulationGraphSvg(simulationOptions)
          : convertCircuitJsonToSchematicSimulationSvg({
              ...simulationOptions,
              schematicOptions: { colorOverrides },
            }),
        renderError: null,
      }
    } catch (error) {
      return {
        simulationSvg: "",
        renderError: error instanceof Error ? error.message : String(error),
      }
    }
  }, [
    circuitJson,
    effectiveWidth,
    effectiveHeight,
    colorOverrides,
    hideSchematic,
    simulationExperimentId,
    acSweepView,
    activeEyeDiagramId,
  ])

  useEffect(() => {
    if (!simulationSvg) {
      setSvgObjectUrl(null)
      return
    }
    const url = URL.createObjectURL(
      new Blob([simulationSvg], { type: "image/svg+xml" }),
    )
    setSvgObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [simulationSvg])

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchend", handleMouseUp)
    return () => {
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchend", handleMouseUp)
    }
  }, [])

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        backgroundColor: getSimulationBackgroundColor(
          simulationSvg,
          colorOverrides,
        ),
        overflow: "hidden",
        minHeight: "300px",
        cursor: isDragging ? "grabbing" : "grab",
        ...containerStyle,
      }}
      className={className}
    >
      {(simulationExperiments.length > 1 || eyes.length > 0) && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "flex-end",
            padding: "8px 16px",
            boxSizing: "border-box",
          }}
        >
          <SimulationSelector
            simulations={simulationExperiments}
            selectedSimulationExperimentId={simulationExperimentId}
            onSelectSimulation={handleSelectSimulation}
          />
          {eyes.length > 0 && (
            <SimulationResultSelector
              eyes={eyes}
              selectedEyeDiagramId={activeEyeDiagramId}
              onSelectEyeDiagram={setSelectedEyeDiagramId}
            />
          )}
        </div>
      )}
      <div
        ref={(node) => {
          containerRef.current = node
          transformRef.current = node
        }}
        style={{
          position: "relative",
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "hidden",
        }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {renderError || !simulationExperimentId ? (
          <div
            role={renderError ? "alert" : "status"}
            style={{
              display: "grid",
              placeContent: "center",
              height: "100%",
              minHeight: "300px",
              padding: 24,
              boxSizing: "border-box",
              fontFamily: "sans-serif",
              color: renderError ? "#dc2626" : "#64748b",
              textAlign: "center",
              gap: 12,
            }}
          >
            <strong>
              {renderError
                ? "Unable to display simulation"
                : "No Simulation Found"}
            </strong>
            <span>
              {renderError ??
                "Pass Circuit JSON with simulation results to view them here."}
            </span>
          </div>
        ) : svgObjectUrl ? (
          <img
            ref={imgRef}
            src={svgObjectUrl}
            alt="Circuit Simulation"
            draggable={false}
            style={{
              transformOrigin: "0 0",
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "contain",
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
