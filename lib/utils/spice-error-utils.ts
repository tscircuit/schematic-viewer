export type SpiceErrorType =
  | "initialization"
  | "syntax"
  | "runtime"
  | "parsing"
  | "network"
  | "timeout"
  | "validation"
  | "unknown"

export interface SpiceErrorDetails {
  type: SpiceErrorType
  title: string
  userMessage: string
  technicalMessage: string
  suggestions: string[]
  canRetry: boolean
}

export const categorizeSpiceError = (
  errorMessage: string,
): SpiceErrorDetails => {
  const lowerError = errorMessage.toLowerCase()

  // Initialization errors
  if (
    lowerError.includes("worker") ||
    lowerError.includes("initialization") ||
    lowerError.includes("not initialized")
  ) {
    return {
      type: "initialization",
      title: "Simulation Engine Error",
      userMessage:
        "The SPICE simulation engine failed to start properly. This might be due to a browser compatibility issue or missing dependencies.",
      technicalMessage: errorMessage,
      suggestions: [
        "Try refreshing the page and running the simulation again",
        "Check if your browser supports Web Workers",
        "Ensure JavaScript is enabled in your browser",
      ],
      canRetry: true,
    }
  }

  // Command syntax errors
  if (
    lowerError.includes("plot command") ||
    lowerError.includes("wrdata") ||
    lowerError.includes("probe")
  ) {
    return {
      type: "syntax",
      title: "SPICE Command Error",
      userMessage: "The SPICE netlist contains unsupported commands or syntax.",
      technicalMessage: errorMessage,
      suggestions: [
        "Use '.probe' or 'wrdata' commands instead of 'plot'",
        "Check your circuit configuration for proper SPICE syntax",
        "Verify all components have valid SPICE representations",
      ],
      canRetry: false,
    }
  }

  // Data parsing errors
  if (
    lowerError.includes("parse") ||
    lowerError.includes("unsupported data type") ||
    lowerError.includes("no time or frequency data")
  ) {
    return {
      type: "parsing",
      title: "Simulation Result Error",
      userMessage:
        "The simulation completed but produced invalid or unreadable results.",
      technicalMessage: errorMessage,
      suggestions: [
        "Check your circuit for missing ground connections",
        "Verify component values are within realistic ranges",
        "Try adjusting simulation time parameters",
      ],
      canRetry: true,
    }
  }

  // Circuit validation errors
  if (lowerError.includes("no output") || lowerError.includes("no data")) {
    return {
      type: "validation",
      title: "Circuit Configuration Error",
      userMessage:
        "The circuit configuration prevents simulation or produces no output.",
      technicalMessage: errorMessage,
      suggestions: [
        "Add voltage or current sources to your circuit",
        "Include measurement points using '.probe' commands",
        "Ensure all components are properly connected",
      ],
      canRetry: false,
    }
  }

  // Runtime simulation errors
  if (
    lowerError.includes("convergence") ||
    lowerError.includes("singular") ||
    lowerError.includes("matrix")
  ) {
    return {
      type: "runtime",
      title: "Simulation Runtime Error",
      userMessage:
        "The simulation failed during execution due to numerical issues.",
      technicalMessage: errorMessage,
      suggestions: [
        "Check for floating nodes or missing connections",
        "Verify component values are not zero or extremely large",
        "Add series resistance to voltage sources if needed",
      ],
      canRetry: true,
    }
  }

  // Default unknown error
  return {
    type: "unknown",
    title: "Unexpected Error",
    userMessage: "An unexpected error occurred during SPICE simulation.",
    technicalMessage: errorMessage,
    suggestions: [
      "Try refreshing the page and running the simulation again",
      "Check your circuit configuration for any issues",
      "Report this issue if it persists",
    ],
    canRetry: true,
  }
}

export const getErrorIcon = (type: SpiceErrorType): string => {
  switch (type) {
    case "initialization":
      return "⚙️"
    case "syntax":
      return "📝"
    case "runtime":
      return "⚡"
    case "parsing":
      return "📊"
    case "validation":
      return "✅"
    case "network":
      return "🌐"
    case "timeout":
      return "⏰"
    default:
      return "❌"
  }
}

export const getErrorColor = (type: SpiceErrorType): string => {
  switch (type) {
    case "initialization":
    case "network":
      return "#ff9800" // orange
    case "syntax":
    case "validation":
      return "#2196f3" // blue
    case "runtime":
    case "parsing":
      return "#f44336" // red
    case "timeout":
      return "#ff5722" // deep orange
    default:
      return "#757575" // gray
  }
}
