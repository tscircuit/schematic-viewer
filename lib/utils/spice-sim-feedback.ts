export type SpiceSimulationFeedbackTone =
  | "info"
  | "success"
  | "warning"
  | "error"

export interface SpiceSimulationFeedback {
  code: string
  tone: SpiceSimulationFeedbackTone
  title: string
  message: string
  suggestions?: string[]
}

const byError = (
  code: string,
  title: string,
  message: string,
  suggestions: string[],
): SpiceSimulationFeedback => ({
  code,
  tone: "error",
  title,
  message,
  suggestions,
})

export const classifySpiceSimulationError = (
  errorMessage: string,
): SpiceSimulationFeedback => {
  const normalized = errorMessage.toLowerCase()

  if (normalized.includes("no '.probe' or 'wrdata' command found")) {
    return byError(
      "missing_probe_or_wrdata",
      "No Output Variables Selected",
      "The simulator could not extract results because the netlist did not define outputs with `.probe` or `wrdata`.",
      [
        "Add `.probe <var1> <var2> ...` to the netlist.",
        "Or use `wrdata <filename> <var1> ...` so values can be collected.",
      ],
    )
  }

  if (
    normalized.includes("'plot' command is not supported") ||
    normalized.includes("plot command is not supported")
  ) {
    return byError(
      "unsupported_plot_command",
      "Unsupported SPICE Command",
      "This simulation path cannot extract chart data from `plot` commands.",
      [
        "Replace `plot ...` with `.probe ...` to define chart variables.",
        "Or use `wrdata <filename> <var1> ...` and convert it to `.probe` variables.",
      ],
    )
  }

  if (normalized.includes("could not create spice simulation worker")) {
    return byError(
      "worker_creation_failed",
      "Simulation Worker Failed To Start",
      "The browser could not initialize the SPICE worker needed to run the simulation.",
      [
        "Rebuild the worker bundle and blob URL files.",
        "Refresh the page after rebuilding assets.",
      ],
    )
  }

  if (normalized.includes("simulation not initialized")) {
    return byError(
      "engine_not_initialized",
      "Simulation Engine Not Initialized",
      "The SPICE engine failed to finish startup before the run request.",
      [
        "Retry the simulation once.",
        "If it persists, check network access to the engine module.",
      ],
    )
  }

  if (normalized.includes("unsupported data type in simulation result")) {
    return byError(
      "unsupported_result_type",
      "Unsupported Result Format",
      "The simulator returned a result format that the viewer cannot parse.",
      [
        "Update the simulation engine/viewer versions to compatible builds.",
        "Try a simpler transient simulation command and rerun.",
      ],
    )
  }

  if (normalized.includes("no time or frequency data in simulation result")) {
    return byError(
      "missing_time_or_frequency_axis",
      "Result Missing Time/Frequency Axis",
      "The simulation returned values but did not include a `time` or `frequency` column for plotting.",
      [
        "Ensure `.tran` or `.ac` analysis output includes axis data.",
        "Verify probed variables match the selected analysis type.",
      ],
    )
  }

  return byError(
    "unknown_simulation_error",
    "Simulation Failed",
    "The simulation returned an unexpected error.",
    ["Check the raw error details below and verify the SPICE netlist syntax."],
  )
}
