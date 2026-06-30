import type { SchematicSheet } from "circuit-json"

export const getSchematicSheetLabel = (
  sheet: SchematicSheet,
  fallbackIndex: number,
) => sheet.name ?? `Sheet ${sheet.sheet_index ?? fallbackIndex + 1}`
