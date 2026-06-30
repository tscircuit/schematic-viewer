export interface SchematicSheetInfo {
  schematic_sheet_id: string
  name?: string
  display_name?: string
  sheet_index?: number
}

export const getSchematicSheetLabel = (
  sheet: SchematicSheetInfo,
  fallbackIndex: number,
) =>
  sheet.display_name ??
  sheet.name ??
  `Sheet ${sheet.sheet_index ?? fallbackIndex + 1}`
