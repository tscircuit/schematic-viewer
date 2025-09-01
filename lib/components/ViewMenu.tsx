import { useMemo, useCallback, memo } from "react"
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

export const ViewMenu = memo(
  ({
    circuitJson,
    circuitJsonKey,
    isVisible,
    onClose,
    showGroups,
    onToggleGroups,
  }: ViewMenuProps) => {
    // Memoize groups check with better caching
    const hasGroups = useMemo(() => {
      if (!circuitJson || circuitJson.length === 0) return false

      try {
        const sourceGroups = su(circuitJson).source_group?.list()
        return sourceGroups && sourceGroups.length > 0
      } catch {
        return false
      }
    }, [circuitJsonKey])

    // Memoize event handlers
    const handleToggleGroups = useCallback(() => {
      if (hasGroups) {
        onToggleGroups(!showGroups)
      }
    }, [hasGroups, showGroups, onToggleGroups])

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (hasGroups) {
          e.currentTarget.style.backgroundColor = "#f0f0f0"
        }
      },
      [hasGroups],
    )

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (hasGroups) {
          e.currentTarget.style.backgroundColor = "transparent"
        }
      },
      [hasGroups],
    )

    if (!isVisible) return null

    // Memoize styles to prevent recreation
    const backdropStyle = {
      position: "absolute" as const,
      inset: 0,
      backgroundColor: "transparent",
      zIndex: zIndexMap.viewMenuBackdrop,
    }

    const menuStyle = {
      position: "absolute" as const,
      top: "56px",
      right: "16px",
      backgroundColor: "#ffffff",
      color: "#000000",
      border: "1px solid #ccc",
      borderRadius: "4px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      minWidth: "200px",
      zIndex: zIndexMap.viewMenu,
    }

    const toggleStyle = {
      padding: "8px 12px",
      cursor: hasGroups ? "pointer" : "not-allowed",
      opacity: hasGroups ? 1 : 0.5,
      fontSize: "13px",
      color: "#000000",
      fontFamily: "sans-serif",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }

    const checkboxStyle = {
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
    }

    const noGroupsStyle = {
      padding: "8px 12px",
      fontSize: "11px",
      color: "#666",
      fontStyle: "italic",
    }

    return (
      <>
        <div onClick={onClose} style={backdropStyle} />
        <div style={menuStyle}>
          <div
            onClick={handleToggleGroups}
            style={toggleStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div style={checkboxStyle}>{showGroups && "✓"}</div>
            View Schematic Groups
          </div>

          {!hasGroups && (
            <div style={noGroupsStyle}>No groups found in this schematic</div>
          )}
        </div>
      </>
    )
  },
)
