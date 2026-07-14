import { zIndexMap } from "../utils/z-index-map"

interface ViewMenuIconProps extends React.ComponentPropsWithRef<"button"> {
  active?: boolean
}

export const ViewMenuIcon = ({
  active = false,
  ...props
}: ViewMenuIconProps) => {
  return (
    <button
      type="button"
      title={active ? "Hide view menu" : "Show view menu"}
      {...props}
      style={{
        position: "absolute",
        top: "16px",
        right: "16px",
        backgroundColor: active ? "#4CAF50" : "#fff",
        color: active ? "#fff" : "#000",
        padding: "8px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        outline: "none",
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
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    </button>
  )
}
