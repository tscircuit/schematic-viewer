import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react"

const SVG_NS = "http://www.w3.org/2000/svg"

/** Add viewer-only interaction to the static warning SVGs. */
export const useSchematicWarnings = ({
  svgDivRef,
  svgContent,
  circuitJsonKey,
}: {
  svgDivRef: RefObject<HTMLDivElement | null>
  svgContent: ReactNode
  circuitJsonKey: string
}) => {
  const minimizedIds = useRef(new Set<string>())

  useLayoutEffect(() => {
    minimizedIds.current.clear()
  }, [circuitJsonKey])

  useLayoutEffect(() => {
    const cleanups: Array<() => void> = []
    for (const warning of svgDivRef.current?.querySelectorAll<SVGGElement>(
      ".schematic-warning",
    ) ?? []) {
      const id = warning.getAttribute("data-warning-id")
      const callout = warning.querySelector<SVGRectElement>(
        '[data-warning-reference="callout"]',
      )
      if (!id || !callout) continue

      const content = Array.from(warning.children) as SVGElement[]
      const originalDisplays = content.map((child) => child.style.display)
      const originalRole = warning.getAttribute("role")
      const message = warning.getAttribute("aria-label") ?? "Warning"
      const icon = document.createElementNS(SVG_NS, "g")
      icon.setAttribute("data-warning-icon", "")
      icon.setAttribute("aria-hidden", "true")
      icon.setAttribute(
        "transform",
        `translate(${callout.getAttribute("x")} ${callout.getAttribute("y")})`,
      )
      const triangle = document.createElementNS(SVG_NS, "path")
      triangle.setAttribute("d", "M 12 1 L 23 22 L 1 22 Z")
      triangle.setAttribute("fill", callout.getAttribute("fill") ?? "#fffaeb")
      triangle.setAttribute(
        "stroke",
        callout.getAttribute("stroke") ?? "#d99a00",
      )
      triangle.setAttribute("stroke-width", "2")
      triangle.setAttribute("stroke-linejoin", "round")
      const mark = document.createElementNS(SVG_NS, "text")
      mark.setAttribute("x", "12")
      mark.setAttribute("y", "18")
      mark.setAttribute("text-anchor", "middle")
      mark.setAttribute("font-size", "16")
      mark.setAttribute("font-family", "sans-serif")
      mark.setAttribute("font-weight", "bold")
      mark.setAttribute("fill", "#5c4300")
      mark.textContent = "!"
      icon.append(triangle, mark)
      warning.append(icon)
      warning.setAttribute("role", "button")
      warning.setAttribute("tabindex", "0")
      warning.style.cursor = "pointer"

      const update = () => {
        const minimized = minimizedIds.current.has(id)
        content.forEach((child, index) => {
          child.style.display = minimized ? "none" : originalDisplays[index]!
        })
        icon.style.display = minimized ? "" : "none"
        warning.setAttribute("aria-expanded", String(!minimized))
        warning.setAttribute(
          "aria-label",
          `${minimized ? "Expand" : "Minimize"} warning: ${message}`,
        )
      }
      const toggle = (event: Event) => {
        event.preventDefault()
        event.stopPropagation()
        if (minimizedIds.current.has(id)) minimizedIds.current.delete(id)
        else minimizedIds.current.add(id)
        update()
      }
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          if (!event.repeat) toggle(event)
          else event.preventDefault()
        }
      }
      const stopPropagation = (event: Event) => event.stopPropagation()
      warning.addEventListener("click", toggle)
      warning.addEventListener("keydown", onKeyDown)
      warning.addEventListener("mousedown", stopPropagation)
      warning.addEventListener("touchstart", stopPropagation)
      update()
      cleanups.push(() => {
        warning.removeEventListener("click", toggle)
        warning.removeEventListener("keydown", onKeyDown)
        warning.removeEventListener("mousedown", stopPropagation)
        warning.removeEventListener("touchstart", stopPropagation)
        icon.remove()
        content.forEach((child, index) => {
          child.style.display = originalDisplays[index]!
        })
        if (originalRole) warning.setAttribute("role", originalRole)
        else warning.removeAttribute("role")
        warning.setAttribute("aria-label", message)
        warning.removeAttribute("aria-expanded")
        warning.removeAttribute("tabindex")
        warning.style.removeProperty("cursor")
      })
    }
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [svgDivRef, svgContent, circuitJsonKey])
}
