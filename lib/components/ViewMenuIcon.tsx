import { zIndexMap } from "../utils/z-index-map"

export const ViewMenuIcon = ({
  onClick,
  active,
}: { onClick: () => void; active: boolean }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        top: "96px",
        right: "16px",
        backgroundColor: active ? "#4CAF50" : "#fff",
        color: active ? "#fff" : "#000",
        padding: "8px",
        borderRadius: "4px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: zIndexMap.viewMenuIcon,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 12h18m-9-9v18" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </div>
  )
}
