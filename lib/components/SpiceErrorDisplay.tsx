import { useState } from "react"
import {
  categorizeSpiceError,
  getErrorIcon,
  getErrorColor,
} from "../utils/spice-error-utils"

interface SpiceErrorDisplayProps {
  error: string
  onRetry?: () => void
  onCopyDetails?: () => void
  showTechnicalDetails?: boolean
}

export const SpiceErrorDisplay: React.FC<SpiceErrorDisplayProps> = ({
  error,
  onRetry,
  onCopyDetails,
  showTechnicalDetails = false,
}) => {
  const [showFullDetails, setShowFullDetails] = useState(false)
  const errorDetails = categorizeSpiceError(error)

  const handleCopyDetails = () => {
    const fullErrorText = `Error Type: ${errorDetails.type}\nTitle: ${errorDetails.title}\nMessage: ${errorDetails.userMessage}\nTechnical Details: ${errorDetails.technicalMessage}\nSuggestions:\n${errorDetails.suggestions.map((s) => `- ${s}`).join("\n")}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullErrorText)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = fullErrorText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }

    onCopyDetails?.()
  }

  return (
    <div
      style={{
        height: "300px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          backgroundColor: "#fafafa",
          border: `2px solid ${getErrorColor(errorDetails.type)}`,
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Error Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#333",
              }}
            >
              {errorDetails.title}
            </h3>
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {errorDetails.type} error
            </div>
          </div>
        </div>

        {/* User-friendly message */}
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "14px",
            lineHeight: 1.5,
            color: "#555",
          }}
        >
          {errorDetails.userMessage}
        </p>

        {/* Suggestions */}
        {errorDetails.suggestions.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#333",
                marginBottom: "8px",
              }}
            >
              Suggestions:
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "20px",
                fontSize: "13px",
                lineHeight: 1.4,
                color: "#555",
              }}
            >
              {errorDetails.suggestions.map((suggestion, index) => (
                <li
                  key={`suggestion-${index}-${suggestion.slice(0, 10)}`}
                  style={{ marginBottom: "4px" }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: showTechnicalDetails ? "16px" : "0",
          }}
        >
          {errorDetails.canRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                padding: "8px 16px",
                backgroundColor: getErrorColor(errorDetails.type),
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = `${getErrorColor(errorDetails.type)}dd`
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = getErrorColor(
                  errorDetails.type,
                )
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = `${getErrorColor(errorDetails.type)}dd`
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = getErrorColor(
                  errorDetails.type,
                )
              }}
            >
              Retry Simulation
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyDetails}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f0f0f0",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#e0e0e0"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0"
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = "#e0e0e0"
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0"
            }}
          >
            Copy Details
          </button>

          {(showTechnicalDetails ||
            errorDetails.technicalMessage !== error) && (
            <button
              type="button"
              onClick={() => setShowFullDetails(!showFullDetails)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f8f8f8",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#e8e8e8"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f8f8"
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = "#e8e8e8"
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f8f8"
              }}
            >
              {showFullDetails ? "Hide" : "Show"} Technical Details
            </button>
          )}
        </div>

        {/* Technical details (expandable) */}
        {showFullDetails && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#666",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              maxHeight: "120px",
              overflowY: "auto",
            }}
          >
            {errorDetails.technicalMessage}
          </div>
        )}
      </div>
    </div>
  )
}
