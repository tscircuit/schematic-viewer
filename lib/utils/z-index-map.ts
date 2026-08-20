export const zIndexMap = {
  contextMenu: 110,
  viewMenu: 55,
  viewMenuIcon: 48,
  clickToInteractOverlay: 100,
  schematicComponentDetailsTooltip: 105,
  // Kept below viewMenuIcon (48): schematicPortHoverOutline + 1 (the port
  // hover label's z-index, see SchematicPortMouseTarget) must also stay
  // clear of every other layer.
  schematicComponentHoverOutline: 45,
  schematicPortHoverOutline: 46,
  schematicSearch: 101,
}
