import { useEffect, useState } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

export interface HoverLabel {
  name: string
  x: number
  y: number
}

export const useSchematicPortHover = ({
  svgDivRef,
  circuitJson,
  svgString,
}: {
  svgDivRef: React.RefObject<HTMLDivElement>
  circuitJson: CircuitJson
  svgString: string
}) => {
  const [hoverLabel, setHoverLabel] = useState<HoverLabel | null>(null)

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const handleEnter = (e: Event) => {
      const target = e.currentTarget as SVGGElement
      const id = target.getAttribute("data-schematic-port-id")
      if (!id) return
      const port = su(circuitJson).source_port.get(id as any)
      const name = (port as any)?.name || id
      const ev = e as MouseEvent
      setHoverLabel({ name, x: ev.clientX, y: ev.clientY })
    }

    const handleMove = (e: Event) => {
      const ev = e as MouseEvent
      setHoverLabel((prev) =>
        prev ? { ...prev, x: ev.clientX, y: ev.clientY } : prev,
      )
    }

    const handleLeave = () => setHoverLabel(null)

    const portEls = svg.querySelectorAll<SVGGElement>(".schematic-port-hover")
    portEls.forEach((el) => {
      el.addEventListener("mouseenter", handleEnter)
      el.addEventListener("mousemove", handleMove)
      el.addEventListener("mouseleave", handleLeave)
    })

    return () => {
      portEls.forEach((el) => {
        el.removeEventListener("mouseenter", handleEnter)
        el.removeEventListener("mousemove", handleMove)
        el.removeEventListener("mouseleave", handleLeave)
      })
    }
  }, [svgString, circuitJson])

  return { hoverLabel }
}
