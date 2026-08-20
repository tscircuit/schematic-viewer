import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSearchResultTransform } from "../lib/utils/get-search-result-transform"
import { getSchematicSearchResults } from "../lib/utils/get-schematic-search-results"

const circuitJson = [
  {
    type: "source_component",
    source_component_id: "source_component_1",
    name: "U1",
    display_value: "USB Controller",
  },
  {
    type: "schematic_component",
    schematic_component_id: "schematic_component_1",
    source_component_id: "source_component_1",
    schematic_sheet_id: "sheet_1",
    port_labels: { pin1: "VBUS", pin2: "D-", pin3: "D+" },
  },
  {
    type: "schematic_net_label",
    schematic_net_label_id: "schematic_net_label_1",
    schematic_sheet_id: "sheet_1",
    text: "GND",
  },
] as CircuitJson

test("finds components by reference designator", () => {
  const results = getSchematicSearchResults(circuitJson, "u1")

  expect(results).toHaveLength(1)
  expect(results[0]?.target).toEqual({
    type: "schematic_component",
    id: "schematic_component_1",
  })
  expect(results[0]?.schematicSheetId).toBe("sheet_1")
})

test("finds components by display name", () => {
  const circuitWithDisplayName = circuitJson.map((element) => {
    if (element.type !== "source_component") return element
    return { ...element, display_name: "USB Connector" }
  }) as CircuitJson

  const results = getSchematicSearchResults(
    circuitWithDisplayName,
    "usb connector",
  )

  expect(results).toHaveLength(1)
  expect(results[0]?.label).toBe("USB Connector")
  expect(results[0]?.target).toEqual({
    type: "schematic_component",
    id: "schematic_component_1",
  })
})

test("shows the display name when searching by reference designator", () => {
  const circuitWithDisplayName = circuitJson.map((element) => {
    if (element.type !== "source_component") return element
    return { ...element, display_name: "USB Connector" }
  }) as CircuitJson

  const results = getSchematicSearchResults(circuitWithDisplayName, "U1")

  expect(results).toHaveLength(1)
  expect(results[0]?.label).toBe("USB Connector")
  expect(results[0]?.detail).toBe("U1 · USB Controller")
})

test("shows reference designator, type, and value below a display name", () => {
  const circuitWithDisplayedResistor = [
    {
      type: "source_component",
      source_component_id: "source_component_r1",
      name: "R1",
      display_name: "Current Limiter",
      ftype: "simple_resistor",
      display_resistance: "300Ω",
    },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_r1",
      source_component_id: "source_component_r1",
    },
  ] as CircuitJson

  const result = getSchematicSearchResults(
    circuitWithDisplayedResistor,
    "R1",
  )[0]

  expect(result?.label).toBe("Current Limiter")
  expect(result?.detail).toBe("R1 · Resistor · 300Ω")
})

test("finds components by manufacturer part number", () => {
  const circuitWithManufacturerPartNumber = circuitJson.map((element) => {
    if (element.type !== "source_component") return element
    return { ...element, manufacturer_part_number: "STM32F103C8T6" }
  }) as CircuitJson

  const results = getSchematicSearchResults(
    circuitWithManufacturerPartNumber,
    "stm32f103",
  )

  expect(results).toHaveLength(1)
  expect(results[0]?.label).toBe("U1")
  expect(results[0]?.target).toEqual({
    type: "schematic_component",
    id: "schematic_component_1",
  })
})

test("finds net labels case-insensitively", () => {
  const results = getSchematicSearchResults(circuitJson, "gnd")

  expect(results.map((result) => result.label)).toEqual(["GND"])
  expect(results[0]?.target.type).toBe("schematic_net_label")
})

test("identifies matching net labels on different schematic sheets", () => {
  const circuitWithMatchingNetsAcrossSheets = [
    {
      type: "schematic_sheet",
      schematic_sheet_id: "sheet_power",
      name: "Power",
      sheet_index: 0,
    },
    {
      type: "schematic_sheet",
      schematic_sheet_id: "sheet_sensors",
      name: "Sensors",
      sheet_index: 1,
    },
    {
      type: "schematic_net_label",
      schematic_net_label_id: "vcc_power",
      schematic_sheet_id: "sheet_power",
      source_net_id: "source_net_vcc",
      text: "VCC",
      center: { x: 0, y: 0 },
    },
    {
      type: "schematic_net_label",
      schematic_net_label_id: "vcc_sensors",
      schematic_sheet_id: "sheet_sensors",
      source_net_id: "source_net_vcc",
      text: "VCC",
      center: { x: 0, y: 0 },
    },
  ] as CircuitJson

  const results = getSchematicSearchResults(
    circuitWithMatchingNetsAcrossSheets,
    "VCC",
  )

  expect(results).toHaveLength(2)
  expect(results.map((result) => result.schematicSheetName)).toEqual([
    "Power",
    "Sensors",
  ])
})

test("does not include component pin labels", () => {
  const results = getSchematicSearchResults(circuitJson, "D-")

  expect(results).toEqual([])
})

test("puts exact matches before partial matches", () => {
  const jsonWithPartialMatch = [
    ...circuitJson,
    {
      type: "schematic_net_label",
      schematic_net_label_id: "schematic_net_label_2",
      text: "GND_SENSE",
    },
  ] as CircuitJson

  expect(
    getSchematicSearchResults(jsonWithPartialMatch, "GND").map(
      (result) => result.label,
    ),
  ).toEqual(["GND", "GND_SENSE"])
})

test("does not match hidden component values", () => {
  const circuitWithCapacitor = [
    ...circuitJson,
    {
      type: "source_component",
      source_component_id: "source_component_2",
      name: "C1",
      display_value: "1uF",
    },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_2",
      source_component_id: "source_component_2",
    },
  ] as CircuitJson

  expect(
    getSchematicSearchResults(circuitWithCapacitor, "u").map(
      (result) => result.label,
    ),
  ).toEqual(["U1"])
})

test("shows the component pin attached to a net label", () => {
  const circuitWithConnectedNet = [
    ...circuitJson,
    {
      type: "source_component",
      source_component_id: "source_component_r1",
      name: "R1",
    },
    {
      type: "source_port",
      source_port_id: "source_port_r1_pin1",
      source_component_id: "source_component_r1",
      name: "pin1",
      pin_number: 1,
    },
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_r1_pin1",
      source_port_id: "source_port_r1_pin1",
      center: { x: 2, y: 3.2 },
    },
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_net_ids: ["source_net_gnd"],
      connected_source_port_ids: ["source_port_r1_pin1"],
    },
  ].map((element) =>
    element.type === "schematic_net_label"
      ? {
          ...element,
          source_net_id: "source_net_gnd",
          anchor_position: { x: 2, y: 3 },
        }
      : element,
  ) as CircuitJson

  expect(
    getSchematicSearchResults(circuitWithConnectedNet, "GND")[0]?.detail,
  ).toBe("Connected to R1.pin1")
})

test("formats component type and value as useful context", () => {
  const circuitWithResistor = [
    {
      type: "source_component",
      source_component_id: "source_component_r1",
      name: "R1",
      ftype: "simple_resistor",
      display_resistance: "10Ω",
    },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_r1",
      source_component_id: "source_component_r1",
    },
  ] as CircuitJson

  expect(getSchematicSearchResults(circuitWithResistor, "R1")[0]?.detail).toBe(
    "Resistor · 10Ω",
  )
})

test("centers a search result and preserves an existing closer zoom", () => {
  const transform = getSearchResultTransform({
    containerRect: { left: 100, top: 50, width: 800, height: 600 },
    targetRect: { left: 450, top: 300, width: 100, height: 60 },
    visibleProjection: { a: 2, b: 0, c: 0, d: 2, e: 100, f: -20 },
    minimumScale: 1.8,
  })

  expect(transform.a).toBe(2)
  expect(transform.d).toBe(2)
  expect(transform.e).toBe(100)
  expect(transform.f).toBe(0)
})

test("zooms in to the minimum search scale", () => {
  const transform = getSearchResultTransform({
    containerRect: { left: 0, top: 0, width: 1000, height: 800 },
    targetRect: { left: 700, top: 500, width: 40, height: 20 },
    visibleProjection: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    minimumScale: 1.8,
  })

  expect(transform.a).toBe(1.8)
  expect(transform.e).toBe(-796)
  expect(transform.f).toBe(-518)
})
