import type {
  CircuitJson,
  SchematicComponent,
  SchematicNetLabel,
  SchematicPort,
  SourceComponentBase,
  SourcePort,
  SourceTrace,
  SchematicSheet,
} from "circuit-json"

type SearchableSourceComponent = SourceComponentBase & {
  display_resistance?: string
  display_capacitance?: string
  display_inductance?: string
  display_frequency?: string
  symbol_display_value?: string
}

export type SchematicSearchResult = {
  label: string
  detail?: string
  kind: "component" | "net"
  schematicSheetId?: string
  schematicSheetName?: string
  target:
    | { type: "schematic_component"; id: string }
    | { type: "schematic_net_label"; id: string }
}

const normalize = (value: unknown) => String(value ?? "").toLocaleLowerCase()

const getTextMatchScore = (text: unknown, query: string) => {
  const normalizedText = normalize(text)
  if (normalizedText === query) return 0
  if (normalizedText.startsWith(query)) return 1
  if (normalizedText.includes(query)) return 2
  return Number.POSITIVE_INFINITY
}

const humanizeComponentType = (ftype: unknown) => {
  if (!ftype) return undefined
  return String(ftype)
    .replace(/^simple_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toLocaleUpperCase())
}

const getComponentDetail = (
  sourceComponent: SearchableSourceComponent | undefined,
  schematicComponent: SchematicComponent,
  primaryLabel: string,
) => {
  const componentType = humanizeComponentType(sourceComponent?.ftype)
  let componentDescription = componentType
  if (
    sourceComponent?.ftype === "simple_chip" &&
    sourceComponent.manufacturer_part_number
  ) {
    componentDescription = sourceComponent.manufacturer_part_number
  }
  const detailParts: string[] = []
  if (
    sourceComponent?.display_name === primaryLabel &&
    sourceComponent.name !== primaryLabel
  ) {
    detailParts.push(sourceComponent.name)
  }

  let componentValue = sourceComponent?.display_value
  if (!componentValue && sourceComponent) {
    for (const displayField of [
      "display_resistance",
      "display_capacitance",
      "display_inductance",
      "display_frequency",
      "symbol_display_value",
    ] as const) {
      if (displayField in sourceComponent) {
        const displayedMeasurement = sourceComponent[displayField]
        if (typeof displayedMeasurement === "string") {
          componentValue = displayedMeasurement
          break
        }
      }
    }
  }
  componentValue ??= schematicComponent.symbol_display_value

  if (componentDescription) {
    detailParts.push(componentDescription)
  }
  if (componentValue) {
    detailParts.push(componentValue)
  }
  if (
    !componentDescription &&
    !componentValue &&
    sourceComponent?.manufacturer_part_number
  ) {
    detailParts.push(sourceComponent.manufacturer_part_number)
  }

  if (detailParts.length === 0) return undefined
  return detailParts.join(" · ")
}

const isSourceComponent = (
  element: CircuitJson[number],
): element is CircuitJson[number] & SearchableSourceComponent =>
  element.type === "source_component" && "source_component_id" in element

const isSourcePort = (element: CircuitJson[number]): element is SourcePort =>
  element.type === "source_port"

const isSourceTrace = (element: CircuitJson[number]): element is SourceTrace =>
  element.type === "source_trace"

const isSchematicComponent = (
  element: CircuitJson[number],
): element is SchematicComponent => element.type === "schematic_component"

const isSchematicPort = (
  element: CircuitJson[number],
): element is SchematicPort => element.type === "schematic_port"

const isSchematicNetLabel = (
  element: CircuitJson[number],
): element is SchematicNetLabel => element.type === "schematic_net_label"

const isSchematicSheet = (
  element: CircuitJson[number],
): element is SchematicSheet => element.type === "schematic_sheet"

const getSchematicSheetName = ({
  schematicSheets,
  schematicSheetId,
}: {
  schematicSheets: SchematicSheet[]
  schematicSheetId?: string
}) => {
  if (schematicSheets.length <= 1 || !schematicSheetId) return undefined
  return schematicSheets.find(
    (sheet) => sheet.schematic_sheet_id === schematicSheetId,
  )?.name
}

export const getSchematicSearchResults = (
  circuitJson: CircuitJson,
  query: string,
): SchematicSearchResult[] => {
  const normalizedQuery = normalize(query).trim()
  if (!normalizedQuery) return []

  const sourceComponents = new Map(
    circuitJson
      .filter(isSourceComponent)
      .map((element) => [element.source_component_id, element]),
  )
  const sourcePorts = new Map(
    circuitJson
      .filter(isSourcePort)
      .map((element) => [element.source_port_id, element]),
  )
  const schematicPorts = circuitJson.filter(isSchematicPort)
  const sourceTraces = circuitJson.filter(isSourceTrace)
  const schematicSheets = circuitJson.filter(isSchematicSheet)
  const results: SchematicSearchResult[] = []
  const resultScores = new Map<SchematicSearchResult, number>()

  for (const component of circuitJson.filter(isSchematicComponent)) {
    const sourceComponent = component.source_component_id
      ? sourceComponents.get(component.source_component_id)
      : undefined
    const primaryLabel =
      sourceComponent?.display_name ?? sourceComponent?.name ?? "Component"
    const componentScore = Math.min(
      getTextMatchScore(sourceComponent?.name, normalizedQuery),
      getTextMatchScore(sourceComponent?.display_name, normalizedQuery),
      getTextMatchScore(
        sourceComponent?.manufacturer_part_number,
        normalizedQuery,
      ),
    )

    if (Number.isFinite(componentScore)) {
      const result: SchematicSearchResult = {
        label: primaryLabel,
        detail: getComponentDetail(sourceComponent, component, primaryLabel),
        kind: "component",
        schematicSheetId: component.schematic_sheet_id,
        schematicSheetName: getSchematicSheetName({
          schematicSheets,
          schematicSheetId: component.schematic_sheet_id,
        }),
        target: {
          type: "schematic_component",
          id: component.schematic_component_id,
        },
      }
      results.push(result)
      resultScores.set(result, componentScore)
    }
  }

  for (const netLabel of circuitJson.filter(isSchematicNetLabel)) {
    if (!normalize(netLabel.text).includes(normalizedQuery)) continue
    const connectedPortIds = new Set<string>()
    for (const trace of sourceTraces.filter((sourceTrace) =>
      sourceTrace.connected_source_net_ids.includes(netLabel.source_net_id),
    )) {
      for (const portId of trace.connected_source_port_ids) {
        connectedPortIds.add(portId)
      }
    }
    const anchorPosition = netLabel.anchor_position ?? netLabel.center
    const nearestConnectedPort = schematicPorts
      .filter(
        (port) =>
          connectedPortIds.has(port.source_port_id) &&
          (!netLabel.schematic_sheet_id ||
            !port.schematic_sheet_id ||
            port.schematic_sheet_id === netLabel.schematic_sheet_id),
      )
      .map((port) => ({
        port,
        distance: Math.hypot(
          port.center.x - anchorPosition.x,
          port.center.y - anchorPosition.y,
        ),
      }))
      .filter(({ distance }) => distance <= 1)
      .sort((a, b) => a.distance - b.distance)[0]?.port
    const sourcePort = nearestConnectedPort
      ? sourcePorts.get(nearestConnectedPort.source_port_id)
      : undefined
    const connectedComponent = sourcePort?.source_component_id
      ? sourceComponents.get(sourcePort.source_component_id)
      : undefined
    const connectedPinName =
      sourcePort?.name ??
      (sourcePort?.pin_number !== undefined
        ? `pin${sourcePort.pin_number}`
        : nearestConnectedPort?.display_pin_label)
    const connectionLabel =
      connectedComponent?.name && connectedPinName
        ? `Connected to ${connectedComponent.name}.${connectedPinName}`
        : undefined
    const result: SchematicSearchResult = {
      label: netLabel.text,
      detail: connectionLabel,
      kind: "net",
      schematicSheetId: netLabel.schematic_sheet_id,
      schematicSheetName: getSchematicSheetName({
        schematicSheets,
        schematicSheetId: netLabel.schematic_sheet_id,
      }),
      target: {
        type: "schematic_net_label",
        id: netLabel.schematic_net_label_id,
      },
    }
    results.push(result)
    resultScores.set(result, getTextMatchScore(netLabel.text, normalizedQuery))
  }

  return results.sort((a, b) => {
    return (
      (resultScores.get(a) ?? Number.POSITIVE_INFINITY) -
        (resultScores.get(b) ?? Number.POSITIVE_INFINITY) ||
      a.label.localeCompare(b.label)
    )
  })
}
