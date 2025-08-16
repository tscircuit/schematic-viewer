import { zIndexMap } from "../utils/z-index-map"

export const GridIcon = ({
  onClick,
  active,
}: { onClick: () => void; active: boolean }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        top: "56px",
        right: "64px",
        backgroundColor: active ? "#4CAF50" : "#fff",
        color: active ? "#fff" : "#000",
        padding: "8px",
        borderRadius: "4px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: zIndexMap.schematicGridIcon,
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
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
      </svg>
    </div>
  )
}
