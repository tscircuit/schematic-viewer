import { SpiceIcon } from "./SpiceIcon"
import { zIndexMap } from "../utils/z-index-map"

export const SpiceSimulationIcon = ({
  onClick,
}: {
  onClick: () => void
}) => {
  return (
    <div
      onClick={onClick}
      title="Run SPICE simulation"
      style={{
        position: "absolute",
        top: "16px",
        right: "112px",
        backgroundColor: "#fff",
        color: "#000",
        padding: "8px",
        borderRadius: "4px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: zIndexMap.spiceSimulationIcon,
      }}
    >
      <SpiceIcon />
    </div>
  )
}
