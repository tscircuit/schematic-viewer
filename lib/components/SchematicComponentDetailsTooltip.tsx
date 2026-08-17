import type { CircuitJson } from "circuit-json"
import { useMemo } from "react"
import {
  type PcbBounds,
  type SourceComponent,
  getFootprintPreviewUrl,
  getSourceComponentInfoEntries,
} from "../utils/component-details"
import { zIndexMap } from "../utils/z-index-map"

interface Props {
  sourceComponent: SourceComponent
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
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(110px, 0.8fr) minmax(0, 1.2fr)",
          gap: "10px 18px",
          margin: 0,
          padding: "18px",
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

      {footprinterString && footprintPreviewUrl && (
        <div style={{ padding: "0 18px 18px" }}>
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
              alt={`${sourceComponent.name} ${footprinterString} PCB footprint`}
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
