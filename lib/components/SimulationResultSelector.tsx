import type { SimulationEyeDiagram } from "circuit-json"

interface Props {
  eyes: SimulationEyeDiagram[]
  selectedEyeDiagramId: string | null
  onSelectEyeDiagram: (simulationEyeDiagramId: string | null) => void
}

export const SimulationResultSelector = ({
  eyes,
  selectedEyeDiagramId,
  onSelectEyeDiagram,
}: Props) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
      maxWidth: "100%",
      fontFamily: "sans-serif",
      fontSize: 13,
      color: "#111",
    }}
  >
    View
    <select
      aria-label="Simulation result view"
      value={selectedEyeDiagramId ?? ""}
      onChange={(event) => onSelectEyeDiagram(event.target.value || null)}
      style={{
        padding: "6px 8px",
        maxWidth: "100%",
        border: "1px solid #cbd5e1",
        borderRadius: 4,
        background: "white",
        color: "#111",
        font: "inherit",
      }}
    >
      <option value="">Waveforms</option>
      {eyes.map((eye) => (
        <option
          key={eye.simulation_eye_diagram_id}
          value={eye.simulation_eye_diagram_id}
        >
          {eye.name} · Eye diagram
        </option>
      ))}
    </select>
  </label>
)
