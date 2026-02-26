import { useMemo } from "react"
import {
  Chart as ChartJS,
  type ChartOptions,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"
import type { PlotPoint } from "../hooks/useSpiceSimulation"
import {
  classifySpiceSimulationError,
  type SpiceSimulationFeedback,
} from "../utils/spice-sim-feedback"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#387908"]

const formatTimeWithUnits = (seconds: number) => {
  if (seconds === 0) return "0s"
  const absSeconds = Math.abs(seconds)

  let unit = "s"
  let scale = 1
  if (absSeconds < 1e-12) {
    unit = "fs"
    scale = 1e15
  } else if (absSeconds < 1e-9) {
    unit = "ps"
    scale = 1e12
  } else if (absSeconds < 1e-6) {
    unit = "ns"
    scale = 1e9
  } else if (absSeconds < 1e-3) {
    unit = "us"
    scale = 1e6
  } else if (absSeconds < 1) {
    unit = "ms"
    scale = 1e3
  }

  return `${parseFloat((seconds * scale).toPrecision(3))}${unit}`
}

const getFeedbackColors = (tone: SpiceSimulationFeedback["tone"]) => {
  if (tone === "error") {
    return {
      backgroundColor: "#fef2f2",
      borderColor: "#fecaca",
      titleColor: "#991b1b",
      textColor: "#7f1d1d",
    }
  }
  if (tone === "warning") {
    return {
      backgroundColor: "#fff7ed",
      borderColor: "#fed7aa",
      titleColor: "#9a3412",
      textColor: "#7c2d12",
    }
  }
  if (tone === "success") {
    return {
      backgroundColor: "#ecfdf5",
      borderColor: "#a7f3d0",
      titleColor: "#065f46",
      textColor: "#065f46",
    }
  }
  return {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    titleColor: "#1e3a8a",
    textColor: "#1e40af",
  }
}

const FeedbackPanel = ({
  feedback,
  rawError,
}: {
  feedback: SpiceSimulationFeedback
  rawError?: string
}) => {
  const colors = getFeedbackColors(feedback.tone)
  return (
    <div
      style={{
        minHeight: "300px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          border: `1px solid ${colors.borderColor}`,
          backgroundColor: colors.backgroundColor,
          borderRadius: "8px",
          padding: "12px 14px",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: "4px",
            color: colors.titleColor,
          }}
        >
          {feedback.title}
        </div>
        <div style={{ color: colors.textColor }}>{feedback.message}</div>
        {feedback.suggestions && feedback.suggestions.length > 0 && (
          <ul
            style={{
              margin: "8px 0 0 18px",
              padding: 0,
              color: colors.textColor,
            }}
          >
            {feedback.suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        )}
        {rawError && feedback.code === "unknown_simulation_error" && (
          <div
            style={{
              marginTop: "10px",
              fontFamily: "monospace",
              fontSize: "12px",
              color: "#111827",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderRadius: "6px",
              padding: "8px 10px",
              border: "1px solid rgba(17, 24, 39, 0.1)",
              wordBreak: "break-word",
            }}
          >
            Raw error: {rawError}
          </div>
        )}
      </div>
    </div>
  )
}

export const SpicePlot = ({
  plotData,
  nodes,
  isLoading,
  error,
  hasRun,
}: {
  plotData: PlotPoint[]
  nodes: string[]
  isLoading: boolean
  error: string | null
  hasRun: boolean
}) => {
  const yAxisLabel = useMemo(() => {
    const hasVoltage = nodes.some((n) => n.toLowerCase().startsWith("v("))
    const hasCurrent = nodes.some((n) => n.toLowerCase().startsWith("i("))
    if (hasVoltage && hasCurrent) return "Value"
    if (hasVoltage) return "Voltage (V)"
    if (hasCurrent) return "Current (A)"
    return "Value"
  }, [nodes])

  if (isLoading) {
    return (
      <FeedbackPanel
        feedback={{
          code: "simulation_running",
          tone: "info",
          title: "Running Simulation",
          message:
            "SPICE analysis is currently running. Results will appear automatically when complete.",
        }}
      />
    )
  }

  if (!hasRun) {
    return (
      <FeedbackPanel
        feedback={{
          code: "simulation_not_started",
          tone: "info",
          title: "Ready To Simulate",
          message:
            'Click "Run" to execute the SPICE simulation and generate waveform data.',
        }}
      />
    )
  }

  if (error) {
    const feedback = classifySpiceSimulationError(error)
    return <FeedbackPanel feedback={feedback} rawError={error} />
  }

  if (plotData.length === 0) {
    return (
      <FeedbackPanel
        feedback={{
          code: "empty_plot_data",
          tone: "warning",
          title: "No Plot Data Returned",
          message:
            "The simulation completed without any chartable points. Check probe variables and analysis commands.",
          suggestions: [
            "Confirm the netlist includes `.probe` variables.",
            "Verify transient settings produce non-empty output.",
          ],
        }}
      />
    )
  }

  if (nodes.length === 0) {
    return (
      <FeedbackPanel
        feedback={{
          code: "all_traces_filtered",
          tone: "warning",
          title: "No Traces Selected",
          message:
            "Simulation data exists, but current visibility filters hide all traces.",
          suggestions: [
            "Enable Voltage and/or Current in the simulation controls.",
          ],
        }}
      />
    )
  }

  const chartData = {
    datasets: nodes.map((node, i) => ({
      label: node,
      data: plotData.map((p) => ({
        x: Number(p.name),
        y: p[node] as number,
      })),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length],
      fill: false,
      tension: 0.1,
    })),
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: "sans-serif",
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            if (tooltipItems.length > 0) {
              const item = tooltipItems[0]
              return formatTimeWithUnits(item.parsed.x as number)
            }
            return ""
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: "Time",
          font: {
            family: "sans-serif",
          },
        },
        ticks: {
          callback: (value) => formatTimeWithUnits(value as number),
          font: {
            family: "sans-serif",
          },
        },
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          font: {
            family: "sans-serif",
          },
        },
        ticks: {
          font: {
            family: "sans-serif",
          },
        },
      },
    },
  }

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          marginBottom: "10px",
          border: "1px solid #a7f3d0",
          backgroundColor: "#ecfdf5",
          color: "#065f46",
          borderRadius: "6px",
          padding: "8px 10px",
          fontSize: "13px",
          lineHeight: 1.4,
        }}
      >
        Simulation complete: {plotData.length} sample
        {plotData.length === 1 ? "" : "s"} across {nodes.length} trace
        {nodes.length === 1 ? "" : "s"}.
      </div>
      <div style={{ position: "relative", height: "260px", width: "100%" }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  )
}
