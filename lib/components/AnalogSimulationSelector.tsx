import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import type { SimulationExperiment } from "circuit-json"
import { useState } from "react"
import { zIndexMap } from "../utils/z-index-map"

interface AnalogSimulationSelectorProps {
  simulations: SimulationExperiment[]
  selectedSimulationExperimentId: string | null
  onSelectSimulation: (simulationExperimentId: string) => void
}

const FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const contentStyles: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#111111",
  borderRadius: 8,
  boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e5e7eb",
  padding: 4,
  minWidth: 220,
  maxWidth: 360,
  maxHeight: 320,
  overflowY: "auto",
  fontSize: 13,
  fontFamily: FONT_FAMILY,
  outline: "none",
  zIndex: zIndexMap.viewMenu,
}

const itemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 10px 7px 8px",
  borderRadius: 6,
  cursor: "pointer",
  outline: "none",
  userSelect: "none",
  color: "#111111",
  fontSize: 13,
  fontFamily: FONT_FAMILY,
}

const iconSlotStyles: React.CSSProperties = {
  width: 16,
  height: 16,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#111111",
}

const ellipsisStyles: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}

const MENU_CSS = `
.sv-simulation-item[data-highlighted], .sv-simulation-item:hover { background-color: #f1f3f5; }
.sv-simulation-chevron { transition: transform 0.2s ease; }
[data-state="open"] > .sv-simulation-chevron { transform: rotate(180deg); }
`

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity: 0.6, flexShrink: 0 }}
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const getSimulationLabels = (simulations: SimulationExperiment[]) => {
  const nameCounts = new Map<string, number>()
  return simulations.map((simulation) => {
    const count = (nameCounts.get(simulation.name) ?? 0) + 1
    nameCounts.set(simulation.name, count)
    return {
      simulation,
      label: count === 1 ? simulation.name : `${simulation.name} (${count})`,
    }
  })
}

/** A toolbar dropdown for switching between analog simulation experiments. */
export const AnalogSimulationSelector = ({
  simulations,
  selectedSimulationExperimentId,
  onSelectSimulation,
}: AnalogSimulationSelectorProps) => {
  const [open, setOpen] = useState(false)

  if (simulations.length <= 1) return null

  const simulationLabels = getSimulationLabels(simulations)
  const selectedSimulation = simulationLabels.find(
    ({ simulation }) =>
      simulation.simulation_experiment_id === selectedSimulationExperimentId,
  )
  const selectedLabel = selectedSimulation?.label ?? "Select simulation"

  return (
    <>
      <style>{MENU_CSS}</style>
      <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            title={selectedLabel}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              maxWidth: "280px",
              padding: "8px 12px",
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "none",
              outline: "none",
              borderRadius: "4px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              fontSize: "13px",
              fontFamily: FONT_FAMILY,
              zIndex: zIndexMap.viewMenuIcon,
            }}
          >
            <span style={{ color: "#888888", flexShrink: 0 }}>Simulation:</span>
            <span style={{ ...ellipsisStyles, minWidth: 0 }}>
              {selectedLabel}
            </span>
            <ChevronDownIcon className="sv-simulation-chevron" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            style={contentStyles}
            side="bottom"
            align="start"
            sideOffset={8}
            collisionPadding={10}
          >
            {simulationLabels.map(({ simulation, label }) => {
              const selected =
                simulation.simulation_experiment_id ===
                selectedSimulationExperimentId
              return (
                <DropdownMenu.Item
                  key={simulation.simulation_experiment_id}
                  className="sv-simulation-item"
                  style={itemStyles}
                  title={label}
                  onSelect={(event) => event.preventDefault()}
                  onPointerUp={() => {
                    onSelectSimulation(simulation.simulation_experiment_id)
                    setOpen(false)
                  }}
                >
                  <span style={iconSlotStyles}>
                    {selected && <CheckIcon />}
                  </span>
                  <span style={{ ...ellipsisStyles, minWidth: 0 }}>
                    {label}
                  </span>
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  )
}
