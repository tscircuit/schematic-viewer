import { useCallback, useRef } from "react"
import { su } from "@tscircuit/soup-util"

export const useComponentDoubleClick = ({
  onClickComponent,
  circuitJson,
  enabled = true,
}: {
  onClickComponent?: (componentId: string, component: any) => void
  circuitJson: any[]
  enabled?: boolean
}) => {
  const lastClickRef = useRef<{
    componentId: string
    timestamp: number
  } | null>(null)

  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!enabled || !onClickComponent) return

      const target = e.target as Element
      const componentGroup = target.closest(
        '[data-circuit-json-type="schematic_component"]',
      )
      
      if (!componentGroup) return

      const componentId = componentGroup.getAttribute(
        "data-schematic-component-id",
      )
      
      if (!componentId) return

      const now = Date.now()
      const lastClick = lastClickRef.current

      if (
        lastClick &&
        lastClick.componentId === componentId &&
        now - lastClick.timestamp < 500
      ) {
        e.preventDefault()
        e.stopPropagation()
        
        const component = su(circuitJson).schematic_component.get(componentId)
        onClickComponent(componentId, component)
        
        lastClickRef.current = null
      } else {
        lastClickRef.current = {
          componentId,
          timestamp: now,
        }
      }
    },
    [onClickComponent, circuitJson, enabled],
  )

  return { handleClick }
}