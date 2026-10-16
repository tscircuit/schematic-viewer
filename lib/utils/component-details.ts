import {
  type PcbBounds,
  getPcbElementBounds,
  getPcbElementsWithinBounds,
} from "@tscircuit/circuit-json-util"
import type {
  CadComponent,
  CircuitJson,
  PcbComponent,
  SchematicComponent,
} from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

export type { PcbBounds } from "@tscircuit/circuit-json-util"

export type SourceComponent = Extract<
  CircuitJson[number],
  { type: "source_component" }
>

export interface SchematicComponentDetails {
  schematicComponent: SchematicComponent
  sourceComponent: SourceComponent
  pcbComponent?: PcbComponent
  footprinterString?: string
  footprintPreviewCircuitJson?: CircuitJson
  footprintPreviewViewBox?: PcbBounds
  warnings: ComponentWarning[]
}

export type ComponentWarning = Extract<
  CircuitJson[number],
  { type: `${string}_warning` }
>

const getComponentWarnings = (
  circuitJson: CircuitJson,
  schematicComponent: SchematicComponent,
  pcbComponent?: PcbComponent,
): ComponentWarning[] =>
  circuitJson.filter((element): element is ComponentWarning => {
    if (!element.type.endsWith("_warning")) return false

    const warning = element as unknown as Record<string, unknown>
    const references = [
      ["source_component", schematicComponent.source_component_id],
      ["schematic_component", schematicComponent.schematic_component_id],
      ["pcb_component", pcbComponent?.pcb_component_id],
    ] as const

    return references.some(([type, id]) => {
      if (!id) return false
      const ids = warning[`${type}_ids`]
      return (
        warning[`${type}_id`] === id ||
        (Array.isArray(ids) && ids.includes(id)) ||
        (warning.schematic_element_type === type &&
          warning.schematic_element_id === id)
      )
    })
  })

export interface ComponentInfoEntry {
  key: string
  label: string
  value: string
}

export interface SupplierPartNumberEntry {
  key: string
  label: "jlcpcb" | "lcsc"
  links: Array<{
    partNumber: string
    href: string
  }>
}

// Only product-facing properties belong in the tooltip. In particular, never
// serialize circuit relationships such as internally_connected_source_port_ids.
const componentInfoLabels: Record<string, string> = {
  name: "Reference",
  resistance: "Resistance",
  capacitance: "Capacitance",
  inductance: "Inductance",
  frequency: "Frequency",
  voltage: "Voltage",
  current: "Current",
  max_voltage_rating: "Max voltage",
  max_current_rating: "Max current",
  power_rating: "Power rating",
  manufacturer_part_number: "Part number",
}

const priorityKeys = Object.keys(componentInfoLabels)

const supplierPartNumberUrls = {
  jlcpcb: (partNumber: string) =>
    `https://jlcpcb.com/partdetail/${encodeURIComponent(partNumber)}`,
  lcsc: (partNumber: string) =>
    `https://www.lcsc.com/product-detail/${encodeURIComponent(partNumber)}.html`,
}

const normalizeLcscPartNumber = (partNumber: string) => {
  const trimmedPartNumber = partNumber.trim()
  const numericPartNumber = /^c?(\d+)$/i.exec(trimmedPartNumber)
  return numericPartNumber ? `C${numericPartNumber[1]}` : trimmedPartNumber
}

const getKeyPriority = (key: string) => {
  const priority = priorityKeys.indexOf(key)
  return priority === -1 ? priorityKeys.length : priority
}

const formatComponentValue = (
  sourceComponent: SourceComponent,
  key: string,
  value: unknown,
) => {
  const displayValue = (sourceComponent as Record<string, unknown>)[
    `display_${key}`
  ]
  if (typeof displayValue === "string" && displayValue.trim()) {
    return displayValue
  }
  return String(value)
}

export const getSourceComponentInfoEntries = (
  sourceComponent: SourceComponent,
): ComponentInfoEntry[] =>
  Object.entries(sourceComponent as Record<string, unknown>)
    .filter(
      ([key, value]) =>
        Object.hasOwn(componentInfoLabels, key) &&
        (typeof value === "string" || typeof value === "number") &&
        String(value).trim() !== "",
    )
    .sort(([keyA], [keyB]) => getKeyPriority(keyA) - getKeyPriority(keyB))
    .map(([key, value]) => ({
      key,
      label: componentInfoLabels[key]!,
      value: formatComponentValue(sourceComponent, key, value),
    }))

export const getSupplierPartNumberEntries = (
  sourceComponent: SourceComponent,
): SupplierPartNumberEntry[] => {
  const supplierPartNumbers = sourceComponent.supplier_part_numbers
  if (!supplierPartNumbers) return []

  return (["jlcpcb", "lcsc"] as const).flatMap((supplier) => {
    const partNumbers = supplierPartNumbers[supplier]
    if (!Array.isArray(partNumbers)) return []

    const normalizedPartNumbers = [
      ...new Set(
        partNumbers
          .filter((partNumber): partNumber is string =>
            Boolean(typeof partNumber === "string" && partNumber.trim()),
          )
          .map(normalizeLcscPartNumber),
      ),
    ]
    if (!normalizedPartNumbers.length) return []

    return [
      {
        key: `supplier_part_numbers.${supplier}`,
        label: supplier,
        links: normalizedPartNumbers.map((partNumber) => ({
          partNumber,
          href: supplierPartNumberUrls[supplier](partNumber),
        })),
      },
    ]
  })
}

export const getSchematicComponentDetails = (
  circuitJson: CircuitJson,
  schematicComponentId: string,
): SchematicComponentDetails | null => {
  const schematicComponent = circuitJson.find(
    (element): element is SchematicComponent =>
      element.type === "schematic_component" &&
      element.schematic_component_id === schematicComponentId,
  )
  if (!schematicComponent) return null

  const sourceComponent = circuitJson.find(
    (element): element is SourceComponent =>
      element.type === "source_component" &&
      element.source_component_id === schematicComponent.source_component_id,
  )
  if (!sourceComponent) return null

  const pcbComponent = circuitJson.find(
    (element): element is PcbComponent =>
      element.type === "pcb_component" &&
      element.source_component_id === sourceComponent.source_component_id,
  )
  const cadComponent = circuitJson.find(
    (element): element is CadComponent =>
      element.type === "cad_component" &&
      element.source_component_id === sourceComponent.source_component_id &&
      (!pcbComponent ||
        element.pcb_component_id === pcbComponent.pcb_component_id),
  )

  // Newer Circuit JSON producers may put this directly on pcb_component;
  // current producers retain it on the associated cad_component.
  const footprinterString =
    (
      pcbComponent as
        | (PcbComponent & { footprinter_string?: string })
        | undefined
    )?.footprinter_string ?? cadComponent?.footprinter_string

  const footprintPreview = pcbComponent
    ? getPcbComponentPreview(circuitJson, pcbComponent.pcb_component_id)
    : null

  return {
    schematicComponent,
    sourceComponent,
    pcbComponent,
    footprinterString,
    footprintPreviewCircuitJson: footprintPreview?.circuitJson,
    footprintPreviewViewBox: footprintPreview?.viewBox,
    warnings: getComponentWarnings(
      circuitJson,
      schematicComponent,
      pcbComponent,
    ),
  }
}

const PCB_PREVIEW_PADDING_MM = 2

interface PcbComponentPreview {
  circuitJson: CircuitJson
  viewBox: PcbBounds
}

/**
 * Select the real PCB context around a component. Elements only need to
 * intersect the view box, so long traces and the board remain available for
 * rendering while the local SVG viewport clips parts outside the preview.
 */
export const getPcbComponentPreview = (
  circuitJson: CircuitJson,
  pcbComponentId: string,
): PcbComponentPreview | null => {
  const pcbComponent = circuitJson.find(
    (element): element is PcbComponent =>
      element.type === "pcb_component" &&
      element.pcb_component_id === pcbComponentId,
  )
  if (!pcbComponent) return null

  const componentBounds = getPcbElementBounds(pcbComponent)
  if (!componentBounds) return null

  const viewBox = {
    minX: componentBounds.minX - PCB_PREVIEW_PADDING_MM,
    minY: componentBounds.minY - PCB_PREVIEW_PADDING_MM,
    maxX: componentBounds.maxX + PCB_PREVIEW_PADDING_MM,
    maxY: componentBounds.maxY + PCB_PREVIEW_PADDING_MM,
  }

  return {
    circuitJson: getPcbElementsWithinBounds(circuitJson, viewBox),
    viewBox,
  }
}

export const getFootprintPreviewUrl = (
  footprintPreviewCircuitJson: CircuitJson,
  viewBox: PcbBounds,
) => {
  const svg = convertCircuitJsonToPcbSvg(footprintPreviewCircuitJson, {
    width: 320,
    height: 240,
    viewport: viewBox,
    backgroundColor: "#f8fafc",
    includeVersion: false,
  })
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
