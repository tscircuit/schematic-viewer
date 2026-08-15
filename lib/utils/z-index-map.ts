export const zIndexMap = {
  schematicEditIcon: 50,
  schematicGridIcon: 49,
  viewMenuIcon: 48,
  viewMenu: 55,
  viewMenuBackdrop: 54,
  clickToInteractOverlay: 100,
  // Kept below viewMenuIcon (48): schematicPortHoverOutline + 1 (the port
  // hover label's z-index, see SchematicPortMouseTarget) must stay clear of
  // schematicGridIcon (49) too.
  schematicComponentHoverOutline: 45,
  schematicPortHoverOutline: 46,
}
