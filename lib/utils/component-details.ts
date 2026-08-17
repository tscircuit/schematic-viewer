import { createSvgUrl } from "@tscircuit/create-snippet-url"
import type {
  AnySourceComponent,
  CadComponent,
  CircuitJson,
  PcbComponent,
  SchematicComponent,
} from "circuit-json"

export interface SchematicComponentDetails {
  schematicComponent: SchematicComponent
  sourceComponent: AnySourceComponent
  pcbComponent?: PcbComponent
  footprinterString?: string
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
  sourceComponent: AnySourceComponent,
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
  sourceComponent: AnySourceComponent,
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
    (element): element is AnySourceComponent =>
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

  return {
    schematicComponent,
    sourceComponent,
    pcbComponent,
    footprinterString,
  }
}

export const getFootprintPreviewUrl = (footprinterString: string) => {
  const code = `
export default () => (
  <board>
    <chip name="U1" footprint={${JSON.stringify(footprinterString)}} />
  </board>
)
`

  const url = new URL(createSvgUrl(code, "pcb"))
  url.searchParams.set("background_color", "#f8fafc")
  return url.toString()
}
