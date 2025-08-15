import { useMemo } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { zIndexMap } from "../utils/z-index-map"

interface ViewMenuProps {
  circuitJson: CircuitJson
  isVisible: boolean
  onClose: () => void
  showGroups: boolean
  onToggleGroups: (show: boolean) => void
}

export const ViewMenu = ({
  circuitJson,
  isVisible,
  onClose,
  showGroups,
  onToggleGroups,
}: ViewMenuProps) => {
  const hasGroups = useMemo(() => {
    if (!circuitJson || circuitJson.length === 0) return false

    try {
      // Check if there are explicit groups
      const sourceGroups = su(circuitJson).source_group?.list() || []
      if (sourceGroups.length > 0) return true

      // Check if we can create virtual groups by component type
      const schematicComponents =
        su(circuitJson).schematic_component?.list() || []
      if (schematicComponents.length > 1) {
        const componentTypes = new Set()
        for (const comp of schematicComponents) {
          const sourceComp = su(circuitJson).source_component.get(
            comp.source_component_id,
          )
          if (sourceComp?.ftype) {
            componentTypes.add(sourceComp.ftype)
          }
        }
        return componentTypes.size > 1 // Only show if there are multiple types
      }

      return false
    } catch (error) {
      console.error("Error checking for groups:", error)
      return false
    }
  }, [circuitJson])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "transparent",
          zIndex: zIndexMap.viewMenuBackdrop,
        }}
      />

      {/* Menu */}
      <div
        style={{
          position: "absolute",
          top: "136px",
          right: "16px",
          backgroundColor: "#2a2a2a",
          color: "#ffffff",
          border: "1px solid #444",
          borderRadius: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          minWidth: "200px",
          zIndex: zIndexMap.viewMenu,
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid #444",
            fontWeight: "bold",
            fontSize: "14px",
            color: "#fff",
          }}
        >
          View ▲
        </div>

        {/* Groups Toggle Option */}
        <div
          onClick={() => {
            console.log("View groups checkbox clicked:", { hasGroups, showGroups })
            if (hasGroups) {
              console.log("Toggling groups from", showGroups, "to", !showGroups)
              onToggleGroups(!showGroups)
            }
          }}
          style={{
            padding: "8px 12px",
            cursor: hasGroups ? "pointer" : "not-allowed",
            opacity: hasGroups ? 1 : 0.5,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            if (hasGroups) {
              e.currentTarget.style.backgroundColor = "#404040"
            }
          }}
          onMouseLeave={(e) => {
            if (hasGroups) {
              e.currentTarget.style.backgroundColor = "transparent"
            }
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid #fff",
              borderRadius: "2px",
              backgroundColor: showGroups ? "#4CAF50" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: "bold",
            }}
          >
            {showGroups && "✓"}
          </div>
          View Schematic Groups
        </div>

        {!hasGroups && (
          <div
            style={{
              padding: "8px 12px",
              fontSize: "11px",
              color: "#999",
              fontStyle: "italic",
            }}
          >
            No groups found in this schematic
          </div>
        )}
      </div>
    </>
  )
}
