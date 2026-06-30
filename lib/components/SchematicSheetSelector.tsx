import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import type { SchematicSheet } from "circuit-json"
import { zIndexMap } from "../utils/z-index-map"

interface SchematicSheetSelectorProps {
  sheets: SchematicSheet[]
  selectedSheetId: string | undefined
  onSelectSheet: (schematicSheetId: string) => void
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
  minWidth: 200,
  maxWidth: 320,
  maxHeight: 320,
  overflowY: "auto",
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

const ellipsisStyles: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}

const MENU_CSS = `
.sv-sheet-item[data-highlighted], .sv-sheet-item:hover { background-color: #f1f3f5; }
.sv-sheet-chevron { transition: transform 0.2s ease; }
[data-state="open"] > .sv-sheet-chevron { transform: rotate(180deg); }
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

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity: 0.6, flexShrink: 0 }}
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

/**
 * A standalone toolbar dropdown for switching the active schematic sheet.
 * Rendered only when the circuit has more than one sheet.
 */
export const SchematicSheetSelector = ({
  sheets,
  selectedSheetId,
  onSelectSheet,
}: SchematicSheetSelectorProps) => {
  if (sheets.length <= 1) return null

  const selectedSheet = sheets.find(
    (s) => s.schematic_sheet_id === selectedSheetId,
  )
  const selectedLabel = selectedSheet?.name ?? "Select sheet"

  return (
    <>
      <style>{MENU_CSS}</style>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            title={selectedLabel}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              maxWidth: "220px",
              padding: "8px 12px",
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "none",
              outline: "none",
              borderRadius: "4px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              fontSize: "13px",
              fontFamily: FONT_FAMILY,
              zIndex: zIndexMap.viewMenuIcon,
            }}
          >
            <span style={{ color: "#888888", flexShrink: 0 }}>Sheet:</span>
            <span style={{ ...ellipsisStyles, minWidth: 0 }}>
              {selectedLabel}
            </span>
            <ChevronDownIcon className="sv-sheet-chevron" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            style={contentStyles}
            side="bottom"
            align="start"
            sideOffset={8}
            collisionPadding={10}
          >
            {sheets.map((sheet) => {
              const selected = sheet.schematic_sheet_id === selectedSheetId
              return (
                <DropdownMenu.Item
                  key={sheet.schematic_sheet_id}
                  className="sv-sheet-item"
                  style={itemStyles}
                  title={sheet.name}
                  onSelect={() => onSelectSheet(sheet.schematic_sheet_id)}
                >
                  <span style={iconSlotStyles}>
                    {selected && <CheckIcon />}
                  </span>
                  <span style={{ ...ellipsisStyles, minWidth: 0 }}>
                    {sheet.name}
                  </span>
                </DropdownMenu.Item>
              )
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  )
}
