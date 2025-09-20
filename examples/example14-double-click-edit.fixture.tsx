import { useCallback, useState } from "react"
import { ControlledSchematicViewer } from "lib/components/ControlledSchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default function Example14DoubleClickEdit() {
  const [lastDoubleClickedComponent, setLastDoubleClickedComponent] = useState<
    string | null
  >(null)

  const handleDoubleClick = useCallback(
    ({ schematicComponentId }: { schematicComponentId: string }) => {
      setLastDoubleClickedComponent(schematicComponentId)

      if (typeof window !== "undefined") {
        window.alert(`Open edit dialog for ${schematicComponentId}`)
      }
    },
    [],
  )

  return (
    <div
      style={{
        padding: "1rem",
        height: "400px",
        boxSizing: "border-box",
      }}
    >
      <ControlledSchematicViewer
        circuitJson={renderToCircuitJson(
          <board width="12mm" height="12mm">
            <resistor name="R1" resistance={220} schX={-2} schY={0} />
            <capacitor name="C1" capacitance="10uF" schX={2} schY={0} />
            <trace from=".R1 .pin2" to=".C1 .pin1" />
          </board>,
        )}
        containerStyle={{ height: "100%" }}
        onClickComponent={handleDoubleClick}
      />
      <p>
        Double-click any component to simulate opening its editing dialog. The
        cursor becomes a pointer to indicate interactivity.
      </p>
      {lastDoubleClickedComponent ? (
        <p>
          Last double-clicked component:{" "}
          <strong>{lastDoubleClickedComponent}</strong>
        </p>
      ) : (
        <p>Double-click a component to see its identifier here.</p>
      )}
    </div>
  )
}