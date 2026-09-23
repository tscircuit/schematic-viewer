import { useCallback, useMemo, useState } from "react"

export interface SchematicViewerController {
  /** @internal Pending command, consumed after the viewer focuses the component. */
  focusRequest: { schematicComponentId: string } | null
  /** @internal Acknowledge only this request, preserving newer commands. */
  onFocusRequestHandled: (request: { schematicComponentId: string }) => void
}

/** Commands may be issued before the viewer mounts (for example while switching tabs). */
export const useSchematicViewerController = () => {
  const [focusRequest, setFocusRequest] =
    useState<SchematicViewerController["focusRequest"]>(null)
  const focusSchematicComponent = useCallback(
    (schematicComponentId: string) => {
      // A fresh request also allows repeatedly focusing the same component.
      setFocusRequest({ schematicComponentId })
    },
    [],
  )
  const onFocusRequestHandled = useCallback(
    (request: NonNullable<SchematicViewerController["focusRequest"]>) => {
      setFocusRequest((current) => (current === request ? null : current))
    },
    [],
  )
  const controller = useMemo(
    () => ({ focusRequest, onFocusRequestHandled }),
    [focusRequest, onFocusRequestHandled],
  )
  return { controller, focusSchematicComponent }
}
