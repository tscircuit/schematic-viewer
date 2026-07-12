import { type Matrix, compose } from "transformation-matrix"

export const SCHEMATIC_PORT_HIT_RADIUS_PX = 36

export function resolveSchematicPortId(
  circuitJson: any[],
  portId: string,
): string | null {
  const bySchematic = circuitJson.find(
    (el) => el.type === "schematic_port" && el.schematic_port_id === portId,
  )
  if (bySchematic) return portId

  const bySource = circuitJson.find(
    (el) => el.type === "schematic_port" && el.source_port_id === portId,
  )
  return bySource?.schematic_port_id ?? null
}

export function createScreenToReal(
  svgToScreenProjection: Matrix,
  realToSvgProjection: Matrix,
  containerRef: { current: HTMLDivElement | null },
) {
  return (screenX: number, screenY: number) => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    const localX = screenX - rect.left
    const localY = screenY - rect.top
    const realToScreen = compose(svgToScreenProjection, realToSvgProjection)
    return {
      x: (localX - realToScreen.e) / realToScreen.a,
      y: (localY - realToScreen.f) / realToScreen.d,
    }
  }
}

export function getSchematicPortCenter(
  circuitJson: any[],
  container: HTMLElement | null,
  schematicPortId: string,
  screenToReal: (screenX: number, screenY: number) => { x: number; y: number },
): { x: number; y: number } | null {
  const port = circuitJson.find(
    (el) =>
      el.type === "schematic_port" && el.schematic_port_id === schematicPortId,
  )
  if (port?.center) {
    return { x: port.center.x, y: port.center.y }
  }

  if (!container) return null
  const el = container.querySelector<SVGElement | HTMLElement>(
    `[data-schematic-port-id="${schematicPortId}"]`,
  )
  if (!el) return null

  const rect = el.getBoundingClientRect()
  return screenToReal(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
  )
}

export function getSchematicPortAtScreen(
  container: HTMLElement | null,
  circuitJson: any[],
  screenX: number,
  screenY: number,
  hitRadiusPx = SCHEMATIC_PORT_HIT_RADIUS_PX,
): string | null {
  if (!container) return null

  let closest: { id: string; dist: number } | null = null
  for (const node of container.querySelectorAll("[data-schematic-port-id]")) {
    const rect = node.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dist = Math.hypot(cx - screenX, cy - screenY)

    if (dist < hitRadiusPx && (!closest || dist < closest.dist)) {
      const id = node.getAttribute("data-schematic-port-id")
      const resolved = id ? resolveSchematicPortId(circuitJson, id) : null
      if (resolved) closest = { id: resolved, dist }
    }
  }

  return closest?.id ?? null
}
