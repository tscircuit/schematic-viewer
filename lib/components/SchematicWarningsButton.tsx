export const SchematicWarningsButton = ({
  count,
  showWarnings,
  onToggle,
}: {
  count: number
  showWarnings: boolean
  onToggle: () => void
}) => {
  const label = `${showWarnings ? "Hide" : "Show"} ${count} ${count === 1 ? "warning" : "warnings"}`

  return (
    <button
      type="button"
      data-schematic-warnings
      title={label}
      aria-label={label}
      aria-pressed={showWarnings}
      onClick={onToggle}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      style={{
        height: "32px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "0 8px",
        border: "none",
        borderRadius: "4px",
        backgroundColor: showWarnings ? "#fff3cd" : "#ffffff",
        color: "#946200",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.3 3.9 1.8 18.1A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4m0 4h.01" />
      </svg>
      <span>{count}</span>
    </button>
  )
}
