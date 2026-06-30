import { useMemo } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { zIndexMap } from "../utils/z-index-map"
import packageJson from "../../package.json"
import { ViewMenuIcon } from "./ViewMenuIcon"

interface ViewMenuProps {
  circuitJson: CircuitJson
  circuitJsonKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
  showGroups: boolean
  onToggleGroups: (show: boolean) => void
  showGrid: boolean
  onToggleGrid: (show: boolean) => void
}

const FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const contentStyles: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#111111",
  borderRadius: 8,
  boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
  border: "1px solid #e5e7eb",
  padding: 4,
  minWidth: 224,
  fontSize: 13,
  fontFamily: FONT_FAMILY,
  outline: "none",
  zIndex: zIndexMap.viewMenu,
}

const itemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 10px 7px 8px",
  borderRadius: 6,
  cursor: "pointer",
  outline: "none",
  userSelect: "none",
  color: "#111111",
  fontSize: 13,
  fontFamily: FONT_FAMILY,
}

const iconSlotStyles: React.CSSProperties = {
  width: 16,
  height: 16,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#111111",
}

const separatorStyles: React.CSSProperties = {
  height: 1,
  backgroundColor: "#ececec",
  margin: "4px 0",
}

const HIGHLIGHT_CSS = `
.sv-vm-item[data-highlighted]:not([data-disabled]),
.sv-vm-item:hover:not([data-disabled]) { background-color: #f1f3f5; }
.sv-vm-item[data-disabled] { opacity: 0.45; cursor: not-allowed; }
`

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const ViewMenu = ({
  circuitJson,
  circuitJsonKey,
  open,
  onOpenChange,
  showGroups,
  onToggleGroups,
  showGrid,
  onToggleGrid,
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
            comp.source_component_id!,
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
  }, [circuitJsonKey])

  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <ViewMenuIcon active={open} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          style={contentStyles}
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={10}
        >
          <style>{HIGHLIGHT_CSS}</style>

          {/* View toggles */}
          <DropdownMenu.Item
            className="sv-vm-item"
            style={itemStyles}
            disabled={!hasGroups}
            title={hasGroups ? undefined : "No groups found in this schematic"}
            onSelect={(e) => {
              e.preventDefault()
              if (hasGroups) onToggleGroups(!showGroups)
            }}
          >
            <span style={iconSlotStyles}>{showGroups && <CheckIcon />}</span>
            <span>View Schematic Groups</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="sv-vm-item"
            style={itemStyles}
            onSelect={(e) => {
              e.preventDefault()
              onToggleGrid(!showGrid)
            }}
          >
            <span style={iconSlotStyles}>{showGrid && <CheckIcon />}</span>
            <span>Show Grid</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator style={separatorStyles} />

          {/* Version */}
          <div
            style={{
              padding: "4px 8px",
              fontSize: 12,
              color: "#9ca3af",
              textAlign: "center",
              fontFamily: FONT_FAMILY,
            }}
          >
            v{String(packageJson?.version)}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
