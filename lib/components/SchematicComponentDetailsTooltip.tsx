import type { CircuitJson } from "circuit-json"
import { useMemo } from "react"
import type { NavigateToPcbComponentOptions } from "../types/schematic-component-navigation"
import {
  type PcbBounds,
  type SourceComponent,
  getFootprintPreviewUrl,
  getSourceComponentInfoEntries,
  getSupplierPartNumberEntries,
} from "../utils/component-details"
import { zIndexMap } from "../utils/z-index-map"

interface Props {
  sourceComponent: SourceComponent
  schematicComponentId: string
  sourceComponentId: string
  pcbComponentId?: string
  onNavigateToPcbComponent?: (options: NavigateToPcbComponentOptions) => void
  footprinterString?: string
  footprintPreviewCircuitJson?: CircuitJson
  footprintPreviewViewBox?: PcbBounds
  left: number
  top: number
  width: number
  maxHeight: number
}

const detailLabelStyle: React.CSSProperties = {
  color: "#64748b",
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: "12px",
  lineHeight: 1.45,
}

export const SchematicComponentDetailsTooltip = ({
  sourceComponent,
  schematicComponentId,
  sourceComponentId,
  pcbComponentId,
  onNavigateToPcbComponent,
  footprinterString,
  footprintPreviewCircuitJson,
  footprintPreviewViewBox,
  left,
  top,
  width,
  maxHeight,
}: Props) => {
  const infoEntries = useMemo(
    () => getSourceComponentInfoEntries(sourceComponent),
    [sourceComponent],
  )
  const supplierPartNumberEntries = useMemo(
    () => getSupplierPartNumberEntries(sourceComponent),
    [sourceComponent],
  )
  const footprintPreviewUrl = useMemo(
    () =>
      footprintPreviewCircuitJson?.length && footprintPreviewViewBox
        ? getFootprintPreviewUrl(
            footprintPreviewCircuitJson,
            footprintPreviewViewBox,
          )
        : undefined,
    [footprintPreviewCircuitJson, footprintPreviewViewBox],
  )
  return (
    <dialog
      open
      aria-label={`${sourceComponent.name} component details`}
      data-schematic-component-details-tooltip
      style={{
        position: "absolute",
        left,
        right: "auto",
        top,
        bottom: "auto",
        width,
        maxHeight,
        margin: 0,
        padding: 0,
        overflowY: "auto",
        boxSizing: "border-box",
        border: "1px solid #cbd5e1",
        borderRadius: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        boxShadow:
          "0 20px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.12)",
        color: "#0f172a",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        pointerEvents: "auto",
        userSelect: "text",
        WebkitUserSelect: "text",
        zIndex: zIndexMap.schematicComponentDetailsTooltip,
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(110px, 0.8fr) minmax(0, 1.2fr)",
          gap: "6px 12px",
          margin: 0,
          padding: "8px",
        }}
      >
        {infoEntries.map((entry) => (
          <div key={entry.key} style={{ display: "contents" }}>
            <dt style={detailLabelStyle}>{entry.label}</dt>
            <dd
              style={{
                minWidth: 0,
                margin: 0,
                color: "#1e293b",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                fontSize: "12px",
                lineHeight: 1.45,
                overflowWrap: "anywhere",
              }}
            >
              {entry.value}
            </dd>
          </div>
        ))}
        {supplierPartNumberEntries.map((entry) => (
          <div key={entry.key} style={{ display: "contents" }}>
            <dt style={detailLabelStyle}>{entry.label}</dt>
            <dd
              style={{
                minWidth: 0,
                margin: 0,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                fontSize: "12px",
                lineHeight: 1.45,
                overflowWrap: "anywhere",
              }}
            >
              {entry.links.map((link, index) => (
                <span key={link.href}>
                  {index > 0 && ", "}
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                  >
                    {link.partNumber}
                  </a>
                </span>
              ))}
            </dd>
          </div>
        ))}
        {footprinterString && (
          <div style={{ display: "contents" }}>
            <dt style={detailLabelStyle}>footprint</dt>
            <dd
              style={{
                minWidth: 0,
                margin: 0,
                color: "#1e293b",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                fontSize: "12px",
                lineHeight: 1.45,
                overflowWrap: "anywhere",
              }}
            >
              {JSON.stringify(footprinterString)}
            </dd>
          </div>
        )}
      </dl>

      {footprintPreviewUrl && (
        <div style={{ padding: "0 4px 4px" }}>
          <div
            style={{
              height: "210px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              borderRadius: "2px",
              background: "#f8fafc",
            }}
          >
            <img
              src={footprintPreviewUrl}
              alt={`${sourceComponent.name}${footprinterString ? ` ${footprinterString}` : ""} PCB footprint`}
              loading="lazy"
              referrerPolicy="no-referrer"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      )}
      {onNavigateToPcbComponent && pcbComponentId && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "4px 8px 8px",
          }}
        >
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onNavigateToPcbComponent({
                schematicComponentId,
                sourceComponentId,
                pcbComponentId,
              })
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #cbd5e1",
              borderRadius: "3px",
              backgroundColor: "#f8fafc",
              color: "#334155",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "12px",
              fontWeight: 500,
              lineHeight: 1.25,
              padding: "4px 8px",
            }}
          >
            Go to PCB View
          </button>
        </div>
      )}
    </dialog>
  )
}
