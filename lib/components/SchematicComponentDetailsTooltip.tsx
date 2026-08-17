import type { AnySourceComponent } from "circuit-json"
import { useMemo } from "react"
import {
  getFootprintPreviewUrl,
  getSourceComponentInfoEntries,
  humanizeComponentField,
} from "../utils/component-details"
import { zIndexMap } from "../utils/z-index-map"

interface Props {
  sourceComponent: AnySourceComponent
  footprinterString?: string
  left: number
  top: number
  width: number
  maxHeight: number
  onClose: () => void
}

const detailLabelStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
}

export const SchematicComponentDetailsTooltip = ({
  sourceComponent,
  footprinterString,
  left,
  top,
  width,
  maxHeight,
  onClose,
}: Props) => {
  const infoEntries = useMemo(
    () => getSourceComponentInfoEntries(sourceComponent),
    [sourceComponent],
  )
  const footprintPreviewUrl = useMemo(
    () =>
      footprinterString ? getFootprintPreviewUrl(footprinterString) : undefined,
    [footprinterString],
  )
  const componentType = sourceComponent.ftype
    ? humanizeComponentField(sourceComponent.ftype)
    : "Component"

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
        borderRadius: "12px",
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          padding: "18px 18px 14px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 750,
              lineHeight: 1.2,
              overflowWrap: "anywhere",
            }}
          >
            {sourceComponent.display_name ?? sourceComponent.name}
          </div>
          <div style={{ color: "#64748b", fontSize: "13px", marginTop: 4 }}>
            {componentType}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close component details"
          onClick={onClose}
          style={{
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
            width: "30px",
            height: "30px",
            padding: 0,
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            background: "#f8fafc",
            color: "#475569",
            cursor: "pointer",
            fontSize: "20px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {infoEntries.length > 0 && (
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(110px, 0.8fr) minmax(0, 1.2fr)",
            gap: "10px 18px",
            margin: 0,
            padding: "16px 18px",
            borderBottom: footprinterString ? "1px solid #e2e8f0" : undefined,
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
        </dl>
      )}

      {footprinterString && footprintPreviewUrl && (
        <div style={{ padding: "16px 18px 18px" }}>
          <div style={{ ...detailLabelStyle, marginBottom: 7 }}>Footprint</div>
          <code
            style={{
              display: "block",
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "7px",
              background: "#f1f5f9",
              color: "#334155",
              fontSize: "12px",
              lineHeight: 1.4,
              overflowWrap: "anywhere",
              whiteSpace: "pre-wrap",
            }}
          >
            {footprinterString}
          </code>
          <div
            style={{
              height: "210px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              borderRadius: "9px",
              background: "#f8fafc",
            }}
          >
            <img
              src={footprintPreviewUrl}
              alt={`${footprinterString} PCB footprint`}
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
    </dialog>
  )
}
