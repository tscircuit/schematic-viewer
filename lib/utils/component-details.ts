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
import { gzipSync, strToU8 } from "fflate"

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
}

export interface ComponentInfoEntry {
  key: string
  label: string
  value: string
}

const hiddenSourceComponentKeys = new Set([
  "type",
  "source_component_id",
  "source_group_id",
  "subcircuit_id",
  "name",
  "display_name",
  "ftype",
  "are_pins_interchangeable",
])

const priorityKeys = [
  "resistance",
  "capacitance",
  "inductance",
  "frequency",
  "voltage",
  "current",
  "max_voltage_rating",
  "max_current_rating",
  "power_rating",
  "manufacturer_part_number",
  "supplier_part_numbers",
]

const getKeyPriority = (key: string) => {
  const priority = priorityKeys.indexOf(key)
  return priority === -1 ? priorityKeys.length : priority
}

export const humanizeComponentField = (field: string) =>
  field
    .replace(/^simple_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())

const formatObjectValue = (value: Record<string, unknown>) =>
  Object.entries(value)
    .map(([key, nestedValue]) => {
      const formattedNestedValue = Array.isArray(nestedValue)
        ? nestedValue.join(", ")
        : String(nestedValue)
      return `${humanizeComponentField(key)}: ${formattedNestedValue}`
    })
    .join(" · ")

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
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.join(", ")
  if (value && typeof value === "object") {
    return formatObjectValue(value as Record<string, unknown>)
  }
  return String(value)
}

export const getSourceComponentInfoEntries = (
  sourceComponent: SourceComponent,
): ComponentInfoEntry[] =>
  Object.entries(sourceComponent as Record<string, unknown>)
    .filter(([key, value]) => {
      if (hiddenSourceComponentKeys.has(key)) return false
      if (
        key.startsWith("display_") &&
        key.slice("display_".length) in sourceComponent
      ) {
        return false
      }
      return value !== undefined && value !== null && value !== ""
    })
    .sort(([keyA], [keyB]) => {
      const priorityDifference = getKeyPriority(keyA) - getKeyPriority(keyB)
      return priorityDifference || keyA.localeCompare(keyB)
    })
    .map(([key, value]) => ({
      key,
      label: humanizeComponentField(key),
      value: formatComponentValue(sourceComponent, key, value),
    }))

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
 * rendering while svg.tscircuit.com clips the parts outside the preview.
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

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ""
  const chunkSize = 8192
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

export const getFootprintPreviewUrl = (
  footprintPreviewCircuitJson: CircuitJson,
  viewBox: PcbBounds,
) => {
  const encodedCircuitJson = bytesToBase64(
    gzipSync(strToU8(JSON.stringify(footprintPreviewCircuitJson))),
  )
  const url = new URL("https://svg.tscircuit.com/")
  url.searchParams.set("svg_type", "pcb")
  url.searchParams.set("circuit_json", encodedCircuitJson)
  url.searchParams.set(
    "viewbox",
    [viewBox.minX, viewBox.minY, viewBox.maxX, viewBox.maxY].join(","),
  )
  url.searchParams.set("background_color", "#f8fafc")
  return url.toString()
}
