import { useMemo } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { zIndexMap } from "../utils/z-index-map"

interface ViewMenuProps {
  circuitJson: CircuitJson
  circuitJsonKey: string
  isVisible: boolean
  onClose: () => void
  showGroups: boolean
  onToggleGroups: (show: boolean) => void
}

export const ViewMenu = ({
  circuitJson,
  circuitJsonKey,
  isVisible,
  onClose,
  showGroups,
  onToggleGroups,
}: ViewMenuProps) => {
  const hasGroups = useMemo(() => {
    if (!circuitJson || circuitJson.length === 0) return false

    try {
      // Quick check: if we have source_group items in the circuit JSON
      const hasSourceGroups = circuitJson.some(item => item.type === 'source_group')
      if (hasSourceGroups) {
        // Check if there are meaningful groups (not just subcircuits)
        const sourceGroups = su(circuitJson).source_group?.list() || []
        const meaningfulGroups = sourceGroups.filter(group => !group.is_subcircuit && group.name && group.name.trim() !== "")
        if (meaningfulGroups.length > 0) return true
      }

      // Quick check: if we have schematic components, check if there are multiple types
      const hasSchematicComponents = circuitJson.some(item => item.type === 'schematic_component')
      if (hasSchematicComponents) {
        const schematicComponents = circuitJson.filter(item => item.type === 'schematic_component')
        if (schematicComponents.length > 1) {
          // Only do expensive lookup if we have multiple components
          const componentTypes = new Set()
          for (const comp of schematicComponents) {
            const sourceComp = su(circuitJson).source_component.get(
              (comp as any).source_component_id,
            )
            if (sourceComp?.ftype) {
              componentTypes.add(sourceComp.ftype)
              // Early exit if we find more than one type
              if (componentTypes.size > 1) return true
            }
          }
        }
      }

      return false
    } catch (error) {
      console.error("Error checking for groups:", error)
      return false
    }
  }, [circuitJsonKey])

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
          top: "56px",
          right: "16px",
          backgroundColor: "#ffffff",
          color: "#000000",
          border: "1px solid #ccc",
          borderRadius: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          minWidth: "200px",
          zIndex: zIndexMap.viewMenu,
        }}
      >
        {/* Groups Toggle Option */}
        <div
          onClick={() => {
            if (hasGroups) {
              onToggleGroups(!showGroups)
            }
          }}
          style={{
            padding: "8px 12px",
            cursor: hasGroups ? "pointer" : "not-allowed",
            opacity: hasGroups ? 1 : 0.5,
            fontSize: "13px",
            color: "#000000",
            fontFamily: "sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            if (hasGroups) {
              e.currentTarget.style.backgroundColor = "#f0f0f0"
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
              border: "2px solid #000",
              borderRadius: "2px",
              backgroundColor: "transparent",
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
              color: "#666",
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
