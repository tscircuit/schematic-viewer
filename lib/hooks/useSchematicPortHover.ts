import { useEffect, useState } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

export interface HoverData {
  name: string
  x: number
  y: number
}

export const useSchematicPortHover = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  const [hover, setHover] = useState<HoverData | null>(null)

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      const portGroup = target.closest(
        "[data-schematic-port-id]",
      ) as SVGGraphicsElement | null
      if (!portGroup) return
      const schPortId = portGroup.getAttribute("data-schematic-port-id")
      if (!schPortId) return
      const schPort = su(circuitJson).schematic_port.get(schPortId)
      if (!schPort) return
      const srcPort = su(circuitJson).source_port.get(schPort.source_port_id)
      if (!srcPort) return
      const rect = portGroup.getBoundingClientRect()
      setHover({
        name: srcPort.name || "",
        x: rect.x + rect.width / 2,
        y: rect.y,
      })
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (
        target.closest("[data-schematic-port-id]") &&
        !svgDiv.contains(e.relatedTarget as Node)
      ) {
        setHover(null)
      }
    }

    svgDiv.addEventListener("mouseover", handleMouseOver)
    svgDiv.addEventListener("mouseout", handleMouseOut)
    return () => {
      svgDiv.removeEventListener("mouseover", handleMouseOver)
      svgDiv.removeEventListener("mouseout", handleMouseOut)
    }
  }, [svgDivRef, circuitJson])

  return hover
}
