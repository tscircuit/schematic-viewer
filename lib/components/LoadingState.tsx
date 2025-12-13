interface LoadingStateProps {
  message?: string
  subMessage?: string
  progress?: number
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Running simulation...",
  subMessage = "Analyzing circuit and computing results",
  progress,
}) => {
  return (
    <div
      style={{
        height: "300px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #2196f3",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "16px",
            color: "#333",
            fontWeight: 600,
            marginBottom: "4px",
          }}
        >
          {message}
        </div>
        <div style={{ fontSize: "14px", color: "#666" }}>{subMessage}</div>
      </div>

      {progress !== undefined && (
        <div style={{ width: "200px" }}>
          <div
            style={{
              height: "4px",
              backgroundColor: "#f0f0f0",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                backgroundColor: "#2196f3",
                borderRadius: "2px",
                transition: "width 0.3s ease",
                width: `${Math.max(5, Math.min(100, progress))}%`,
              }}
            />
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#999",
              marginTop: "8px",
              textAlign: "center",
            }}
          >
            {Math.round(progress)}% complete
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
