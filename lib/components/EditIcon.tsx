import { zIndexMap } from "../utils/z-index-map"

export const EditIcon = ({
  onClick,
  active,
}: { onClick: () => void; active: boolean }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        top: "16px",
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
        zIndex: zIndexMap.schematicEditIcon,
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
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </div>
  )
}
