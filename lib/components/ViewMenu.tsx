import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useMemo } from "react"
import packageJson from "../../package.json"
import { zIndexMap } from "../utils/z-index-map"

interface ViewMenuProps {
  circuitJson: CircuitJson
  circuitJsonKey: string
  menuRef: React.RefObject<HTMLDivElement | null>
  menuPos: { x: number; y: number }
  onOpenChange: (open: boolean) => void
  showGroups: boolean
  onToggleGroups: (show: boolean) => void
  showGrid: boolean
  onToggleGrid: (show: boolean) => void
  showPorts: boolean
  onTogglePorts: (show: boolean) => void
}

const FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const contentStyles: React.CSSProperties = {
  backgroundColor: "#262626",
  color: "#fafafa",
  borderRadius: 6,
  boxShadow:
    "0px 12px 48px -12px rgba(0, 0, 0, 0.5), 0px 8px 24px -8px rgba(0, 0, 0, 0.3)",
  border: "1px solid #333333",
  padding: 4,
  minWidth: 208,
  fontSize: 14,
  fontWeight: 400,
  fontFamily: FONT_FAMILY,
  outline: "none",
  zIndex: zIndexMap.contextMenu,
}

const itemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 8px",
  borderRadius: 6,
  cursor: "default",
  outline: "none",
  userSelect: "none",
  color: "#fafafa",
  fontSize: 14,
  fontWeight: 400,
  fontFamily: FONT_FAMILY,
}

const iconSlotStyles: React.CSSProperties = {
  width: 16,
  height: 16,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fafafa",
}

const separatorStyles: React.CSSProperties = {
  height: 1,
  backgroundColor: "#ffffff1a",
  margin: "4px 0",
}

const HIGHLIGHT_CSS = `
.sv-vm-item[data-highlighted]:not([data-disabled]),
.sv-vm-item:hover:not([data-disabled]) { background-color: #404040; }
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
  menuRef,
  menuPos,
  onOpenChange,
  showGroups,
  onToggleGroups,
  showGrid,
  onToggleGrid,
  showPorts,
  onTogglePorts,
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

  const hasPorts = useMemo(() => {
    if (!circuitJson || circuitJson.length === 0) return false

    try {
      return (su(circuitJson).schematic_port?.list() || []).length > 0
    } catch (error) {
      console.error("Error checking for schematic ports:", error)
      return false
    }
  }, [circuitJsonKey])

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: menuPos.x,
        top: menuPos.y,
        width: 0,
        height: 0,
      }}
    >
      <DropdownMenu.Root open={true} onOpenChange={onOpenChange} modal={false}>
        <DropdownMenu.Trigger asChild>
          <div style={{ position: "absolute", width: 1, height: 1 }} />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            style={contentStyles}
            align="start"
            sideOffset={0}
            collisionPadding={10}
            avoidCollisions={true}
          >
            <style>{HIGHLIGHT_CSS}</style>

            <DropdownMenu.Item
              className="sv-vm-item"
              style={itemStyles}
              disabled={!hasPorts}
              title={hasPorts ? undefined : "No ports found in this schematic"}
              onSelect={(event) => event.preventDefault()}
              onPointerDown={(event) => {
                event.preventDefault()
                if (hasPorts) onTogglePorts(!showPorts)
              }}
            >
              <span style={iconSlotStyles}>{showPorts && <CheckIcon />}</span>
              <span>Show Schematic Ports</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className="sv-vm-item"
              style={itemStyles}
              disabled={!hasGroups}
              title={
                hasGroups ? undefined : "No groups found in this schematic"
              }
              onSelect={(event) => event.preventDefault()}
              onPointerDown={(event) => {
                event.preventDefault()
                if (hasGroups) onToggleGroups(!showGroups)
              }}
            >
              <span style={iconSlotStyles}>{showGroups && <CheckIcon />}</span>
              <span>View Schematic Groups</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className="sv-vm-item"
              style={itemStyles}
              onSelect={(event) => event.preventDefault()}
              onPointerDown={(event) => {
                event.preventDefault()
                onToggleGrid(!showGrid)
              }}
            >
              <span style={iconSlotStyles}>{showGrid && <CheckIcon />}</span>
              <span>Show Grid</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator style={separatorStyles} />

            <div
              style={{
                padding: "4px 8px 4px 32px",
                fontSize: 11,
                opacity: 0.35,
                color: "#a1a1aa",
                letterSpacing: "0.2px",
                fontFamily: FONT_FAMILY,
              }}
            >
              @tscircuit/schematic-viewer@{String(packageJson?.version)}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
